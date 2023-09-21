const getAllKeys = (params: { [key: string]: any }, prefix?: string ): string[] => {
    let allKeys: string[] = [];

    Object.keys(params).forEach((key: string) => {
        if(typeof params[key] === "object" && !Array.isArray(params[key])) {
            let prev = prefix;
            prev ? prev += `.${key}` : prev = key

            allKeys = [...allKeys, ...getAllKeys(params[key], prev)]
        } else {
            if(prefix) key = `${prefix}.${key}`;
            return allKeys = [...allKeys, key]
        }
    })

    return allKeys
}

export default getAllKeys