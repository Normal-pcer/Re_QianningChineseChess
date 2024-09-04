export function deepCopy<T>(target: T): T {
    const map = new WeakMap();
    const stack = new Set<unknown>();

    function isObject(obj: unknown): obj is object {
        return typeof obj === "object" && obj !== null;
    }

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
        if (typeof data === "function") return generateSafeFunction(data);

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
