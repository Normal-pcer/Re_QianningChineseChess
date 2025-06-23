function isObject(obj: unknown): obj is object {
    return typeof obj === "object" && obj !== null;
}

/**
 * 深拷贝一个对象
 * @param value 原始值
 * @param seen 用于存储中间状态
 * @returns 生成的副本
 */
export function deepCopy<T>(value: T, seen: WeakMap<any, any> = new WeakMap()): T {
    // 处理基本类型和函数
    if (typeof value !== "object" || value === null) {
        return value;
    }

    // 处理循环引用
    if (seen.has(value)) {
        return seen.get(value);
    }

    // 处理 Date 对象
    if (value instanceof Date) {
        const copy = new Date(value) as T;
        seen.set(value, copy);
        return copy;
    }

    // 处理 RegExp 对象
    if (value instanceof RegExp) {
        const copy = new RegExp(value.source, value.flags) as T;
        seen.set(value, copy);
        return copy;
    }

    // 处理 Set
    if (value instanceof Set) {
        const copy = new Set() as Set<any>;
        seen.set(value, copy);
        value.forEach((v) => copy.add(deepCopy(v, seen)));
        return copy as T;
    }

    // 处理 Map
    if (value instanceof Map) {
        const copy = new Map() as Map<any, any>;
        seen.set(value, copy);
        value.forEach((v, k) => copy.set(deepCopy(k, seen), deepCopy(v, seen)));
        return copy as T;
    }

    // 处理 Array
    if (Array.isArray(value)) {
        const copy: any[] = [];
        seen.set(value, copy);
        value.forEach((v, i) => (copy[i] = deepCopy(v, seen)));
        return copy as T;
    }

    // 处理普通对象
    const copy = Object.create(Object.getPrototypeOf(value));
    seen.set(value, copy);

    // 复制所有属性（包括 Symbol 属性）
    Reflect.ownKeys(value).forEach((key) => {
        copy[key] = deepCopy((value as any)[key], seen);
    });

    return copy;
}

export function notNull(value: any) {
    return value !== null && value !== undefined;
}

export function deepMerge<T>(target: T, source: T, removeFuckingExtraArrayItems = false) {
    const stack = new Set<any>();
    /**
     * @returns 是否可以合并
     */
    function mergeData(target: any, source: any): boolean {
        if (!isObject(source) || !isObject(target)) return false;
        if (source instanceof Array && target instanceof Array) {
            if (removeFuckingExtraArrayItems) {
                if (source.length < target.length) {
                    target.length = source.length;
                }
            }
            for (let i = 0; i < source.length; i++) {
                if (!mergeData(target[i], source[i])) {
                    target[i] = source[i];
                }
            }
            return true;
        }
        if (source instanceof HTMLElement && target instanceof HTMLElement) {
            return false;
        }
        if (source instanceof Date && target instanceof Date) {
            return false;
        }
        if (source instanceof RegExp && target instanceof RegExp) {
            return false;
        }
        if (source instanceof Map && target instanceof Map) {
            source.forEach((value, key) => {
                let mergedValue = mergeData(target.get(key), value);
                target.set(key, mergedValue ? mergedValue : value);
            });
            return true;
        }
        if (source instanceof Set && target instanceof Set) {
            return false;
        }
        if (stack.has(source)) {
            throw new Error("循环引用的对象");
        }
        stack.add(source);
        let keys = Reflect.ownKeys(source); // source 中所有的键名

        keys.forEach((key: PropertyKey) => {
            const value = source[key as keyof typeof source];
            if (isObject(value)) {
                if (target[key as keyof typeof target]) {
                    // 如果已经存在
                    mergeData(target[key as keyof typeof target], value);
                } else {
                    // 不存在，直接赋值
                    target[key as keyof typeof target] = value;
                }
            } else {
                // 如果不是对象，直接赋值
                target[key as keyof typeof target] = value;
            }
        });

        stack.delete(source);
        return true;
    }

    mergeData(target, source);
}
