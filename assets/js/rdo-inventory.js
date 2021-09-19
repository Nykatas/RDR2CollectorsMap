/*
    To get your inventory data from RDO, run this code on Social Club
    Dont forget to change to your character plataform
    
    Thanks to Bob Ross https://github.com/Senexis/Social-Club-Tool/
*/
const RDOInventory = {
    // Platforms: pc, ps4, xboxone, stadia
    Platform: 'pc',
    Items: [],

    getCookie: function (name) {
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    },

    doRequest: function (object) {

        console.log("Requesting inventory...");

        try {
            var bearerToken = this.getCookie(siteMaster.scauth.tokenCookieName);
            var requestInfo = {
                method: object.method,
                credentials: 'include',
                cache: 'default',
                mode: 'cors',
                headers: {
                    'authorization': `Bearer ${bearerToken}`,
                    'x-requested-with': 'XMLHttpRequest'
                }
            };

            fetch(object.url, requestInfo)
                .then(response => {
                    if (!response.ok) {
                        throw response;
                    }

                    return response.json();
                })
                .then(json => object.success(json))
                .catch(error => {
                    if (error instanceof Error) {
                        object.error(error);
                    } else if (error instanceof Response) {
                        if (error.status === 401) {
                            this.doRefreshRequest(object);
                        } else if (error.status === 429) {
                            object.error(new Error('Rate limited.'));
                        } else {
                            object.error(new Error(`Request failed: ${error.status} - ${error.statusText}`));
                        }
                    } else {
                        object.error(new Error('Something went wrong.'));
                    }
                });
        } catch (error) {
            object.error(error);
        }
    },

    doRefreshRequest: function (object) {
        try {
            if (object.triedRefresh) throw new Error('Could not refresh access.');
            object.triedRefresh = true;

            var bearerToken = this.getCookie(siteMaster.scauth.tokenCookieName);
            var requestInfo = {
                method: 'POST',
                body: `accessToken=${bearerToken}`,
                credentials: 'include',
                cache: 'default',
                mode: 'cors',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'x-requested-with': 'XMLHttpRequest'
                }
            };

            fetch('https://socialclub.rockstargames.com/connect/refreshaccess', requestInfo)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Could not refresh access.');
                    }

                    this.doRequest(object);
                })
                .catch(error => object.error(error));
        } catch (error) {
            object.error(error);
        }
    },

    copy: function(text){
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }

}

RDOInventory.doRequest(
    {
        url: `https://scapi.rockstargames.com/games/rdo/inventory/character?platform=${RDOInventory.Platform}&forRockstarId=${window.siteMaster.authRockstarId}`,
        method: 'GET',
        success: function (json) {
            RDOInventory.Items = [];
            json.items.forEach(item => { RDOInventory.Items.push({ itemid: item.itemid, quantity: item.quantity }) });
            RDOInventory.copy(`Inventory.import(${JSON.stringify(RDOInventory.Items)})`);
            console.log(`Inventory data copied to the clipboard.`);
        },
        error: function (error) {
            console.log(`ERROR: ${error}`);
        }
    })