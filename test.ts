import { deepCopy } from "./utils.js";

window.onload = () => {
    // 测试循环引用
    const obj: any = { name: "Object" };
    obj.self = obj;
    obj.data = [1, 2, 3];
    obj.data.push(obj); // 数组中包含对象自身

    const copy = deepCopy(obj);

    console.log(copy !== obj); // true
    console.log(copy.self === copy); // true (循环引用保持)
    console.log(copy.data[3] === copy); // true (数组中的循环引用)

}
