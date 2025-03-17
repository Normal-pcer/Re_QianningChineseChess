import { Serializable, TypeRegistry } from "./serialize.js";

interface I {
    apply(): void;
}

@TypeRegistry.register()
class B extends Serializable implements I {
    apply(): void {}
    apply2(): void {}
}

class Box<T> {
    item: T;
    constructor(item: T) {
        this.item = item;
    }
}

class C<T> {
    list: Array<Box<T>> = [];

    add(item: Box<T>): void {
        this.list.push(item);
    }
}

function main() {
    let container = new C<I>();
    let box = new Box(new B);
    container.add(box);
}

main();