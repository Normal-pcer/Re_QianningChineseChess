/**
 * 处理对象的序列化与反序列化。
 * 可以配合 JSON 模块使用。
 */

/**
 * 用于处理循环引用。
 * 作为序列化时的上下文。会为每个对象记录 id。
 */
class CircularRefManager {
    private currentId: number = 0;
    private objectToId = new WeakMap<object, number>();
    private idToObject = new Map<number, object>();

    hasObject(obj: object): boolean {
        return this.objectToId.has(obj);
    }
    getId(obj: object): number {
        if (!this.objectToId.has(obj)) {
            this.objectToId.set(obj, this.currentId);
            this.idToObject.set(this.currentId, obj);
            this.currentId++;
        }
        return this.objectToId.get(obj) ?? -1;
    }
    getObject(id: number): object | undefined {
        return this.idToObject.get(id);
    }
    // 添加对象到管理器中，返回 id
    addObject(obj: object, id: number | null = null) {
        id ??= this.currentId++;
        this.objectToId.set(obj, id);
        this.idToObject.set(id, obj);
        return id;
    }
}

export class SerializeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SerializeError";
    }
}

/**
 * 类型注册表，维护类型名称到构造函数的映射。
 * 提供类型注册和反序列化时的对象恢复功能。
 *
 * @example 注册一个类，默认使用类名作为类型名
 * @TypeRegistry.register()
 * class MyClass extends Serializable {}
 *
 *
 * @TypeRegistry.register("CustomType")
 * class AnotherClass extends Serializable {}
 */
export class TypeRegistry {
    static registry = new Map<string, new (...args: any[]) => any>();
    /**
     * 类装饰器工厂函数，用于将类注册到类型注册表。
     * @param typeName 注册的类型名称，可选。若未提供，则使用类名。
     * @returns 类装饰器
     */
    static register<T extends new (...args: any[]) => Serializable>(typeName?: string) {
        return (ctor: T) => {
            const name = typeName ?? ctor.name;
            TypeRegistry.registry.set(name, ctor);
            ctor.prototype.__registeredType = name;
            return ctor;
        };
    }

    /**
     * 将 JSON 对象转换为对应的类型实例。
     * 处理逻辑：
     * 1. 若对象是数组，递归处理每个元素
     * 2. 若对象含有 __registeredType 属性，视为 Serializable 类型：
     *    a. 查找注册表中对应的构造函数
     *    b. 若存在 fromJSON 方法（静态/实例），优先使用
     *    d. 否则，若存在getConstructArgs，使用其返回值作为构造参数并直接返回
     *    e. 否则，无参构造后赋值所有属性，最后调用afterRevive进行后处理
     * 3. 普通对象直接返回
     *
     * @param obj 待转换的JSON对象
     * @returns 转换后的对象实例
     * @throws SerializeError 当遇到未注册类型或构造失败时
     */
    static revive(obj: any): any {
        // if (obj === null || obj === undefined)  debugger;
        let idToRevived = new Map<number, any>();

        const revive_recursion = (obj: any): any => {
            if (typeof obj !== "object" || obj === null) return obj;
            if (Array.isArray(obj)) {
                return obj.map(revive_recursion);
            }
            if (obj?.__registeredType) {
                // 特判循环引用
                if (obj.__registeredType === "__circleRef") {
                    return obj;
                }
                // 转换为 Serializable
                const Ctor = TypeRegistry.registry.get(obj.__registeredType);
                if (Ctor) {
                    // 如果存在 fromJson 方法，最优先使用
                    // 静态方法
                    if (typeof (Ctor as any).fromJSON === "function") {
                        const result = (Ctor as any).fromJSON(obj);
                        if (result instanceof Serializable) {
                            if (obj?.__refId !== undefined) idToRevived.set(obj.__refId, result);
                            return result;
                        } else {
                            throw new SerializeError(
                                `Result of '${obj.__registeredType}'.fromJSON not extends Serializable.`
                            );
                        }
                    }
                    // 实例方法
                    if (typeof Ctor.prototype.fromJSON === "function") {
                        const result = Ctor.prototype.fromJSON.call(null, obj);
                        if (result instanceof Serializable) {
                            if (obj?.__refId !== undefined) idToRevived.set(obj.__refId, result);
                            return result;
                        } else {
                            throw new SerializeError(
                                `Result of '${obj.__registeredType}'.prototype.fromJSON not extends Serializable.`
                            );
                        }
                    }

                    let instance: any;
                    if (Ctor.prototype.getConstructArgs) {
                        // 尝试根据指定的构造函数参数创建实例
                        const args = Ctor.prototype.getConstructArgs(obj);
                        instance = new Ctor(...args);
                    } else {
                        try {
                            // 尝试无参数构造
                            instance = new Ctor();
                        } catch {
                            throw new SerializeError(
                                `Cannot create instance of type '${obj.__registeredType}' with default constructor.`
                            );
                        }

                        // 直接赋值所有属性
                        Object.entries(obj).forEach(([key, value]) => {
                            if (key !== "__registeredType" && key !== "__refId") {
                                instance[key] = revive_recursion(value);
                            }
                        });

                        // 可能需要调用 afterRevive 方法
                        instance.afterRevive?.();
                    }

                    if (instance instanceof Serializable) {
                        if (obj?.__refId !== undefined) idToRevived.set(obj.__refId, instance);
                        return instance;
                    } else {
                        throw new SerializeError(
                            `'${obj.__registeredType}' not extends Serializable.`
                        );
                    }
                } else {
                    console.log("Error on reviving object: ", obj);
                    throw new SerializeError(
                        `Cannot find type '${obj.__registeredType}' in registry.`
                    );
                }
            } else {
                let result: any = {};
                for (let key in obj) {
                    result[key] = revive_recursion(obj[key]);
                }
                if (obj?.__refId !== undefined) idToRevived.set(obj.__refId, result);
                return result;
            }
        };
        // 将 __toRefId 形式转化为循环引用形式，修改 obj 对象
        const restore_ref_recursion = (obj: any): void => {
            if (typeof obj !== "object" || obj === null) {
                return;
            }
            if (Array.isArray(obj)) {
                for (let i = 0; i != obj.length; i++) {
                    if (obj[i]?.__toRefId !== undefined) {
                        if (!idToRevived.has(obj[i].__toRefId)) {
                            console.log("Error on restoring ref: ", obj);
                            throw new SerializeError(
                                `Cannot find object with refId ${obj[i].__toRefId}`
                            );
                        }
                        obj[i] = idToRevived.get(obj[i].__toRefId);
                    } else {
                        restore_ref_recursion(obj[i]);
                    }
                }
            } else {
                for (let key in obj) {
                    if (obj[key]?.__toRefId !== undefined) {
                        if (!idToRevived.has(obj[key].__toRefId)) {
                            console.log("Error on restoring ref: ", obj);
                            throw new SerializeError(
                                `Cannot find object with refId ${obj[key].__toRefId}`
                            );
                        }
                        obj[key] = idToRevived.get(obj[key].__toRefId);
                    } else {
                        restore_ref_recursion(obj[key]);
                    }
                }
            }
        };
        let revived = revive_recursion(obj);
        restore_ref_recursion(revived);
        return revived;
    }
}

/**
 * 可序列化类型基类，提供序列化框架。
 * 派生类需注意：
 * 1. 必须使用 @TypeRegistry.register 装饰器注册
 * 2. 可选实现以下方法：
 *    - toJSON(): 自定义序列化逻辑
 *    - fromJSON(): 自定义反序列化逻辑
 *    - getSerializeKeys(): 返回需要序列化的属性键
 *    - getConstructArgs(): 提供构造参数
 *    - afterRevive(): 反序列化后处理
 *
 * 如果违反了 (1)，反序列化之后将会变成最近的一层父类。
 *
 * 可以使用 serialize 和 deserialize 方法与合法 JSON 对象进行转换。
 * 二者的具体行为见各自的文档。
 */
export abstract class Serializable {
    /**
     * 保留的键名，这些键名不会被序列化，而是用于存储类型信息等数据。
     */
    private static readonly RESERVED_KEYS = ["__registeredType"];
    // static readonly __registeredType!: string;
    /**
     * 通过传入的 JSON 对象，获取构造函数需要的参数。
     * 要求调用完构造函数即为需要的对象。
     *
     * @param obj JSON 对象
     */
    getConstructArgs?(obj: any): any[];
    /**
     * 部分情况下，在反序列化之后调用该方法。
     * 具体见 TypeRegistry.revive()。
     */
    afterRevive?(): void;
    /**
     * 获取所有需要被存储在 JSON 中的键名。
     */
    getSerializeKeys?(): string[];
    /**
     * 自定义序列化逻辑。
     * 如果有实现，会优先调用此方法。
     */
    toJSON?(): any;
    /**
     * 自定义反序列化逻辑。
     * 如果有实现，会优先调用此方法。
     * @param obj JSON 对象
     */
    static fromJSON?(obj: any): Serializable;

    /**
     * 通过给定上下文，序列化当前对象为 JSON 格式。
     * 处理流程：
     * 1. 若实现 toJSON，直接使用其返回值。
     * 2. 否则如果有 getSerializeKeys，则包含对应键名。
     * 3. 否则包含所有自有属性。
     * 3. 递归序列化属性值。
     *
     * 使用以下方法处理循环引用：
     * 1. 使用 WeakSet 记录已经序列化的对象。
     * 2. 若对象已经序列化过，则返回：{
     *      __registeredType: __circleRef,
     *      __toRefId: (number id)
     *  }
     * 特别地，如果循环引用直接指向一个数组，无法处理。
     *
     * @returns 包含 __registeredType 的 JSON 对象。
     * @throws SerializeError 当无法获取类型。
     */
    serialize(): any {
        let context = new CircularRefManager();
        let new_context = new CircularRefManager();
        let need_record_id = new Set<number>(); // 需要记录在结果中的所有 __refId

        const serialize_recursion = (obj: any): any => {
            // 如果是平凡类型
            if (typeof obj !== "object" || obj === null) {
                return obj;
            }

            if (context.hasObject(obj)) {
                // 循环引用
                let id = context.getId(obj);
                need_record_id.add(id); // 需要记录这个的 __refId
                if (Array.isArray(obj)) {
                    console.log(`Error occurred on following object: `, obj);
                    throw new SerializeError(`Cannot serialize array with circular reference.`);
                }
                // 返回占位对象
                return {
                    __registeredType: "__circleRef",
                    __toRefId: id,
                };
            }

            let id = context.addObject(obj);

            // 如果是数组
            if (Array.isArray(obj)) {
                // 递归序列化数组
                let result = obj.map((item) => serialize_recursion(item));
                new_context.addObject(result, id);
                return result;
            }

            // 如果是 Serializable
            if (obj instanceof Serializable) {
                const typeName = (obj as any).__registeredType;
                if (typeof typeName !== "string") {
                    console.log(`Error occurred on following object: `, obj);
                    throw new SerializeError("Cannot get type name from object.");
                }

                // 直接调用 toJSON 方法
                if (obj.toJSON) {
                    let res = serialize_recursion({
                        __registeredType: typeName,
                        ...obj.toJSON(),
                    });
                    new_context.addObject(res, id);
                    return res;
                }
                // 筛选键名
                const keys =
                    obj.getSerializeKeys?.() ??
                    Object.keys(obj).filter(
                        (key) =>
                            !Serializable.RESERVED_KEYS.includes(key) &&
                            Object.prototype.hasOwnProperty.call(obj, key)
                    );
                let result: any = { __registeredType: typeName };
                for (const key of keys) {
                    result[key] = serialize_recursion((obj as any)[key]);
                }
                new_context.addObject(result, id);
                return result;
            }

            // 如果是普通对象，递归深入
            if (typeof obj === "object") {
                let result: any = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        result[key] = serialize_recursion(obj[key]);
                    }
                }
                new_context.addObject(result, id);
                return result;
            }

            // 其他类型，不做处理
            return obj;
        };
        // 在结果中记录一些数的 id
        const record_id_recursion = (obj: any): void => {
            if (typeof obj !== "object" || obj === null) {
                return;
            }
            if (new_context.hasObject(obj)) {
                let id = new_context.getId(obj);
                if (need_record_id.has(id)) {
                    obj.__refId = id;
                }
            }
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    record_id_recursion(item);
                }
            } else {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        record_id_recursion(obj[key]);
                    }
                }
            }
        };
        let result = serialize_recursion(this);
        record_id_recursion(result);
        return result;
    }

    /**
     * 从 JSON 对象反序列化。
     * 内部会调用 TypeRegistry.revive 方法，具体行为见其文档。
     * @param obj 包含 __registerType 的 JSON 对象
     * @returns 反序列化的实例
     * @throws SerializeError 当恢复失败时
     */
    static deserialize(obj: any): Serializable {
        const result = TypeRegistry.revive(obj);
        if (result instanceof Serializable) {
            return result;
        } else {
            console.log("Error on deserializing object: ", obj);
            throw new SerializeError("Cannot deserialize object to Serializable.");
        }
    }
}

