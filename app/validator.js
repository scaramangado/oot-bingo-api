function isBlank(any) {
    return any === null || any === undefined || any === "";
}


export function validate_request(request) {

    if (isBlank(request.version)) {
        return { valid: false, description: "A version must be specified" };
    }

    if (isBlank(request.seed) && isBlank(request.seeds)) {
        return { valid: false, description: "Either 'seed' or 'seeds' must be specified" };
    }

    if (!isBlank(request.seed) && !isBlank(request.seeds)) {
        return { valid: false, description: "Only one field out of 'seed' and 'seeds' may be specified" };
    }

    if (!isBlank(request.seed) && !/^\d+$/.test(request.seed)) {
        return { valid: false, description: "The seed must be a number" };
    }

    if (!isBlank(request.seeds) && !/^\d+(,\d+)*$/.test(request.seeds)) {
        return { valid: false, description: "The seeds must be a comma-separated list of numbers" };
    }

    const mode = request.mode || "normal";
    const seeds = !isBlank(request.seed) ? [parseInt(request.seed)] : request.seeds.split(",").map(s => parseInt(s));

    return { valid: true, requestInfo: { version: request.version, seeds: seeds, mode: mode } };
}
