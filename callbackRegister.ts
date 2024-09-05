const registry: { [key: string]: Function } = {};

/**
 * @param callback 要注册的函数
 * @param key 键名; 如果为null,则自动指派键名:
 * - 如果callback的函数名未被注册过,则使用函数名
 * - 如果函数名已被注册过,则使用函数名+使得新名没被注册的最小的正整数
 * @return 键名
 */
export function registerCallback(callback: Function, key: string | null = null) {
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
export function registerAnonymous<T extends Function>(callback: T, key: string | null = null): T {
    registerCallback(callback, key);
    return callback;
}

export function getCallback(key: string) {
    return registry[key];
}

export function removeCallback(key: string) {
    delete registry[key];
}

export function getCallbackRegistryKey(callback: Function) {
    if (registry[callback.name]) {
        return callback.name;
    } else {
        for (const key in registry) {
            if (registry[key] === callback) {
                return key;
            }
        }
        return null;
    }
}
