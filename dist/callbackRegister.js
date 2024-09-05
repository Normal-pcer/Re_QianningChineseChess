const registry = {};
/**
 * @param callback 要注册的函数
 * @param key 键名; 如果为null,则自动指派键名:
 * - 如果callback的函数名未被注册过,则使用函数名
 * - 如果函数名已被注册过,则使用函数名+使得新名没被注册的最小的正整数
 * @return 键名
 */
export function registerCallback(callback, key = null) {
    if (key === null) {
        key = callback.name;
    }
    let i = 1;
    while (registry[key] != null) {
        key = callback.name + i;
        i++;
    }
    if (registry[key] == null) {
        registry[key] = callback;
    }
    return key;
}
/**
 * 用于匿名函数的快速注册
 * @param callback 要注册的函数
 * @param key 键名; 如果为null,则自动指派键名:
 * - 如果callback的函数名未被注册过,则使用函数名
 * - 如果函数名已被注册过,则使用函数名+使得新名没被注册的最小的正整数
 * @return 函数本身
 */
export function registerAnonymous(callback, key = null) {
    registerCallback(callback, key);
    return callback;
}
export function getCallback(key) {
    return registry[key];
}
export function removeCallback(key) {
    delete registry[key];
}
export function getCallbackRegistryKey(callback) {
    if (registry[callback.name]) {
        return callback.name;
    }
    else {
        for (const key in registry) {
            if (registry[key] === callback) {
                return key;
            }
        }
        return null;
    }
}
//# sourceMappingURL=callbackRegister.js.map