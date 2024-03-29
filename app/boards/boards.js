import https from "https";
import vm from "vm";

class Boards {

    #scripts = {};
    #allVersions = undefined;

    async generateResponse(request) {

        if (!this.#scripts[request.version]) {

            const seedRandom = await this.#getSeedRandom();
            if (!seedRandom) {
                return { status: 502, body: { error: "GitHub not available." } };
            }

            if (!this.#allVersions) {
                this.#allVersions = await this.#downloadVersionInfo();
                if (!this.#allVersions) {
                    return { status: 502, body: { error: "Failed to fetch version info." } };
                }
            }

            let versionNumber;
            let versionPath;

            try {
                versionNumber = request.version.match(/^v?([.\d]+)$/)[1];
                versionPath = this.#allVersions.versions[versionNumber];
            } catch (e){
                return { status: 400, body: { error: `Version number ${request.version} is invalid` } };
            }

            let goalList;
            let generator;

            try {
                goalList = await this.#downloadFile(this.#goalListUrl(versionPath));
                generator = await this.#downloadFile(this.#generatorUrl(versionPath));
            } catch (e) {
                console.error(e);
                return { status: 404, body: { error: `Version ${request.version} not found` } };
            }

            this.#scripts[request.version] = `${seedRandom}\n${goalList}\n${generator}`;
        }

        return {
            status: 200, body: {
                version: request.version,
                mode: request.mode,
                boards: request.seeds.map(seed => {
                    return { seed: seed, goals: this.#goals(request.version, seed, request.mode) };
                }),
            },
        };
    }

    #goals = (version, seed, mode) => {
        let sandbox = {};
        const fullScript = this.#scripts[version] + this.#boardToArray(seed, mode);
        try {
            vm.runInNewContext(fullScript, sandbox);
            return sandbox.goals;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    #goalListUrl = (version) => `https://raw.githubusercontent.com/ootbingo/bingo/main/${version}/goal-list.js`;

    #generatorUrl = (version) => `https://raw.githubusercontent.com/ootbingo/bingo/main/${version}/generator.js`;

    #boardToArray = (seed, mode) => `
        function generateBoard() {	
    	    const bingoFunc = typeof BingoLibrary !== 'undefined'? BingoLibrary.ootBingoGenerator : ootBingoGenerator;
            
    	    bingoOpts = {
    	       seed: "${seed}",
    	       mode: "${mode}",
    	       lang: "name",
    	    };
        
    	    var bingoBoard = bingoFunc(bingoList, bingoOpts);
        
            var goalList = [];

            if(bingoBoard) {
                for (var i = 1; i < 26; i++) {
                    goalList[i - 1] = bingoBoard[i].name;
                }
            } else {
                return "";
            }

            return goalList;
        }

        var goals = generateBoard();`;

    #getSeedRandom = async () => {
        try {
            return await this.#downloadFile("https://raw.githubusercontent.com/ootbingo/bingo/main/lib/seedrandom-min.js");
        } catch (e) {
            console.log(e);
            return null;
        }
    };

    #downloadVersionInfo = async () => {
        try {
            const file = await this.#downloadFile("https://raw.githubusercontent.com/ootbingo/bingo/main/api/v1/available_versions.json");
            return JSON.parse(file);
        } catch (e) {
            console.log(e);
            return undefined;
        }
    };

    #downloadFile = (url) => {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {

                const { statusCode } = response;

                if (statusCode / 100 !== 2) {
                    reject(`Resource ${url} not found`);
                }

                let chunks_of_data = [];

                response.on("data", (fragments) => {
                    chunks_of_data.push(fragments);
                });

                response.on("end", () => {
                    let response_body = Buffer.concat(chunks_of_data);

                    // promise resolved on success
                    resolve(response_body.toString());
                });

                response.on("error", (error) => {
                    // promise rejected on error
                    reject(error);
                });
            });
        });
    };
}

export default Boards;
