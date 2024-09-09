function isObject(obj: unknown): obj is object {
    return typeof obj === "object" && obj !== null;
}
export function deepCopy<T>(target: T): T {
    const map = new WeakMap();
    const stack = new Set<unknown>();

    function cloneData(data: unknown): unknown {
        if (!isObject(data)) return data;
        if (data instanceof Date) return new Date(data);
        if (data instanceof RegExp) return new RegExp(data.source, data.flags);
        if (data instanceof Array) {
            const result: unknown[] = [];
            for (let i = 0; i < data.length; i++) {
                result.push(cloneData(data[i]));
            }
            return result;
        }
        if (typeof data === "function") return data;

        if (stack.has(data)) {
            throw new Error("Cannot clone object with circular reference");
        }
        stack.add(data);

        const exist = map.get(data);
        if (exist) return exist;
        // if (data instanceof HTMLElement) return data.cloneNode(true);
        if (data instanceof HTMLElement) return data;
        if (data instanceof Map) {
            const result = new Map();
            map.set(data, result);
            data.forEach((value, key) => {
                result.set(key, cloneData(value));
            });
            return result;
        }

        if (data instanceof Set) {
            const result = new Set();
            map.set(data, result);
            data.forEach((value) => {
                result.add(cloneData(value));
            });
            return result;
        }

        const keys = Reflect.ownKeys(data);
        const allDesc = Object.getOwnPropertyDescriptors(data);
        const result = Object.create(Object.getPrototypeOf(data), allDesc);
        map.set(data, result);

        keys.forEach((key: PropertyKey) => {
            const value = data[key as keyof typeof data];
            result[key] = isObject(value) ? cloneData(value) : value;
        });

        stack.delete(data);
        return result;
    }

    function generateSafeFunction(fn: Function): Function {
        const code = fn.toString();
        const bodyStart = code.indexOf("{") + 1;
        const bodyEnd = code.lastIndexOf("}");
        const fnBody = code.slice(bodyStart, bodyEnd);
        const newFnCode = `return function ${fn.name ?? "anonymous"}() { ${fnBody} }`;
        return new Function(newFnCode)();
    }

    return cloneData(target) as T;
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
