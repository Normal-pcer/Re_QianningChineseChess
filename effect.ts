import { AttributeModifier } from "./attributeProvider.js";

class Effect {
    name: string = "";
    id: string = "";
    description: string = "";
    relatedModifiers: AttributeModifier<any>[] = [];
    expire: number = -1;
    constructor(
        name: string,
        id: string,
        description: string = "",
        relatedModifiers: AttributeModifier<any>[] = [],
        expire: number = -1,
        addCurrent: boolean = true
    ) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.relatedModifiers = relatedModifiers;
        this.expire = expire;            
        
    }
}
