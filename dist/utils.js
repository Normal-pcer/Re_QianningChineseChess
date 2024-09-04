export function deepCopy(target) {
    const map = new WeakMap();
    const stack = new Set();
    function isObject(obj) {
        return typeof obj === "object" && obj !== null;
    }
    function cloneData(data) {
        if (!isObject(data))
            return data;
        if (data instanceof Date)
            return new Date(data);
        if (data instanceof RegExp)
            return new RegExp(data.source, data.flags);
        if (data instanceof Array) {
            const result = [];
            for (let i = 0; i < data.length; i++) {
                result.push(cloneData(data[i]));
            }
            return result;
        }
        if (typeof data === "function")
            return generateSafeFunction(data);
        if (stack.has(data)) {
            throw new Error("Cannot clone object with circular reference");
        }
        stack.add(data);
        const exist = map.get(data);
        if (exist)
            return exist;
        // if (data instanceof HTMLElement) return data.cloneNode(true);
        if (data instanceof HTMLElement)
            return data;
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
        keys.forEach((key) => {
            const value = data[key];
            result[key] = isObject(value) ? cloneData(value) : value;
        });
        stack.delete(data);
        return result;
    }
    function generateSafeFunction(fn) {
        const code = fn.toString();
        const bodyStart = code.indexOf("{") + 1;
        const bodyEnd = code.lastIndexOf("}");
        const fnBody = code.slice(bodyStart, bodyEnd);
        const newFnCode = `return function ${fn.name ?? "anonymous"}() { ${fnBody} }`;
        return new Function(newFnCode)();
    }
    return cloneData(target);
}
export function notNull(value) {
    return value !== null && value !== undefined;
}
//# sourceMappingURL=utils.js.map