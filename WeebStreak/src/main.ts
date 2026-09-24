/// <reference path="../types/plugin.d.ts" />
/// <reference path="../types/weebstreak.d.ts" />

function init() {
    // #region: Seanime Hooks

    // * Manual Entry Update outside viewing content
    $app.onPostUpdateEntry(function (e) {
        if (!e || !e.mediaId) {
            e.next();
            return;
        }

        var query = 'query ($id: Int) { Media (id: $id) { type title { english userPreferred romaji } } }';

        fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: query, variables: { id: e.mediaId } })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                let title = "Unknown Entry";
                let mediaType = "Unknown Type";

                if (result && result.data && result.data.Media) {
                    title = result.data.Media.title.english || result.data.Media.title.romaji || title;
                    mediaType = result.data.Media.type;
                }

                $store.set("weebstreak:update", { type: mediaType, title: title });
            })
            .catch(function (error) {
                $store.set("weebstreak:update", { type: "MANGA", title: "Unknown Manga" });
            });

        e.next();
    });

    // * Manual Entry Update inside the vieweing content
    $app.onPostUpdateEntryProgress((e) => {
        if (!e || !e.mediaId) {
            e.next();
            return;
        }

        var query = 'query ($id: Int) { Media (id: $id) { type title { english userPreferred romaji } } }';

        fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query: query, variables: { id: e.mediaId } })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                let title = "Unknown Entry";
                let mediaType = "Unknown Type";

                if (result && result.data && result.data.Media) {
                    title = result.data.Media.title.english || result.data.Media.title.romaji || title;
                    mediaType = result.data.Media.type;
                }

                $store.set("weebstreak:update", { type: mediaType, title: title });
            })
            .catch(function (error) {
                $store.set("weebstreak:update", { type: "MANGA", title: "Unknown Manga" });
            });

        e.next();
    });

    // #endregion Seanime Hooks

    $ui.register(async function (ctx) {
        // #region: UI context & logic 
        const STORAGE_KEY = "weebstreak:data:v2";

        function padZero(num: number) {
            return num < 10 ? '0' + num : String(num);
        }

        function getAdjustedDate() {
            let now = new Date();
            now.setHours(now.getHours() - 4);
            let year = now.getFullYear();
            let month = padZero(now.getMonth() + 1);
            let day = padZero(now.getDate());
            return year + '-' + month + '-' + day;
        }

        function setStoredData(data: StreakData) {
            $storage.set(STORAGE_KEY, data);
        }

        function getStoredData(): StreakData {
            let defaultData = {
                currentStreaks: { general: 0, anime: 0, manga: 0 },
                longestStreaks: 0,
                lastUpdateDate: "",
                lastTitle: "",
                history: []
            };

            let data = $storage.get(STORAGE_KEY);

            if (!data) {
                setStoredData(defaultData);
                return defaultData;
            }

            return data as StreakData;
        }

        function checkAndResetBrokenStreak() {
            let data = getStoredData();

            if (!data.lastUpdateDate) return;

            let today = getAdjustedDate();
            let lastDate = new Date(data.lastUpdateDate);
            let currentDate = new Date(today);
            let diffTime = currentDate.getTime() - lastDate.getTime();
            let diffDays = Math.round(diffTime / (1000 * 3600 * 24));

            if (diffDays > 1 && data.currentStreaks.general > 0) {
                data.currentStreaks = { general: 0, anime: 0, manga: 0 };
                setStoredData(data);
            }
        }

        function checkAndUpdateStreak(type: string, title: string) {
            let data = getStoredData();
            let today = getAdjustedDate();

            if (data.lastUpdateDate === today) {
                return false;
            }

            let historyArray = (data.history && Array.isArray(data.history)) ? data.history : [];
            historyArray = [{ date: today, title: title, type: type }].concat(historyArray);

            if (historyArray.length > 7) {
                historyArray = historyArray.slice(0, 7);
            }
            data.history = historyArray;

            let subType = type.toLowerCase() as "anime" | "manga";

            if (!data.lastUpdateDate) {
                data.currentStreaks[subType] += 1;
                data.currentStreaks.general += 1;
            } else {
                let lastDate = new Date(data.lastUpdateDate);
                let currentDate = new Date(today);
                let diffTime = currentDate.getTime() - lastDate.getTime();
                let diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                if (diffDays === 1) {
                    data.currentStreaks[subType] += 1;
                    data.currentStreaks.general += 1;
                } else {
                    data.currentStreaks[subType] = 1;
                    data.currentStreaks.general = 1;
                }
            }

            if (data.currentStreaks.general > data.longestStreaks) {
                data.longestStreaks = data.currentStreaks.general;
            }

            data.lastUpdateDate = today;
            data.lastTitle = title;

            setStoredData(data);

            return true;
        }

        // * Listeners
        $store.watch<{ type: string; title: string }>("weebstreak:update", (payload) => {
            if (payload && payload.type && payload.title) {
                let wasUpdated = checkAndUpdateStreak(payload.type, payload.title);

                if (wasUpdated) {
                    ctx.toast.success(`Streak Updated: ${payload.title}`);
                }
            }
        });
        // #endregion UI context & logic 

        // #region: Icons
        const flameBase64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNCIgaGVpZ2h0PSI0MiIgdmlld0JveD0iMCAwIDM0IDQyIiBmaWxsPSJub25lIj4KICA8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfNF82MykiPgogICAgPHBhdGggZD0iTTE5Ljg4MzggMS4wOTY5NEMxOS42OTg4IDAuOTQzMjAxIDE5LjQ3OTcgMC44MzYxNzYgMTkuMjQ0NyAwLjc4NDg4NEMxOS4wMDk4IDAuNzMzNTkyIDE4Ljc2NiAwLjczOTUzOCAxOC41MzM4IDAuODAyMjJDMTguMzAxNiAwLjg2NDkwMSAxOC4wODggMC45ODI0ODIgMTcuOTEwOCAxLjE0NTA1QzE3LjczMzYgMS4zMDc2MSAxNy41OTggMS41MTA0IDE3LjUxNTYgMS43MzYzMUwxMy4zOTA2IDEzLjA2MzJMOC44NjA2MiA4LjY3MzgxQzguNzA4NDkgOC41MjYyNiA4LjUyNjgyIDguNDEyNjIgOC4zMjc1OCA4LjM0MDM4QzguMTI4MzMgOC4yNjgxNCA3LjkxNjA0IDguMjM4OTQgNy43MDQ3IDguMjU0NzFDNy40OTMzNSA4LjI3MDQ3IDcuMjg3NzQgOC4zMzA4NSA3LjEwMTQyIDguNDMxODVDNi45MTUxIDguNTMyODUgNi43NTIzMSA4LjY3MjE5IDYuNjIzNzUgOC44NDA2OUMyLjU2MjUgMTQuMTYxOSAwLjUgMTkuNTE1MSAwLjUgMjQuNzUwMUMwLjUgMjkuMTI2MSAyLjIzODM5IDMzLjMyMyA1LjMzMjc0IDM2LjQxNzNDOC40MjcwOSAzOS41MTE3IDEyLjYyMzkgNDEuMjUwMSAxNyA0MS4yNTAxQzIxLjM3NjEgNDEuMjUwMSAyNS41NzI5IDM5LjUxMTcgMjguNjY3MyAzNi40MTczQzMxLjc2MTYgMzMuMzIzIDMzLjUgMjkuMTI2MSAzMy41IDI0Ljc1MDFDMzMuNSAxMy42MDMyIDIzLjk3NjkgNC41MDAwNiAxOS44ODM4IDEuMDk2OTRaIiBmaWxsPSIjRUU0NDQ0Ij48L3BhdGg+CiAgICA8cGF0aCBkPSJNMjAuMTg0NCAxOC44NTcxQzIwLjA3NTIgMTguNzgzIDE5Ljk0NTcgMTguNzMxNSAxOS44MDY4IDE4LjcwNjhDMTkuNjY4IDE4LjY4MjEgMTkuNTIzOSAxOC42ODUgMTkuMzg2NyAxOC43MTUyQzE5LjI0OTYgMTguNzQ1MyAxOS4xMjMzIDE4LjgwMTkgMTkuMDE4NiAxOC44ODAyQzE4LjkxMzkgMTguOTU4NSAxOC44MzM4IDE5LjA1NjEgMTguNzg1MSAxOS4xNjQ5TDE2LjM0NzYgMjQuNjE4NkwxMy42NzA4IDIyLjUwNTJDMTMuNTgwOSAyMi40MzQyIDEzLjQ3MzUgMjIuMzc5NCAxMy4zNTU4IDIyLjM0NDdDMTMuMjM4MSAyMi4zMDk5IDEzLjExMjYgMjIuMjk1OCAxMi45ODc3IDIyLjMwMzRDMTIuODYyOCAyMi4zMTEgMTIuNzQxMyAyMi4zNDAxIDEyLjYzMTIgMjIuMzg4N0MxMi41MjEyIDIyLjQzNzMgMTIuNDI1IDIyLjUwNDQgMTIuMzQ5IDIyLjU4NTZDOS45NDkxNiAyNS4xNDc3IDguNzMwNDEgMjcuNzI1MSA4LjczMDQxIDMwLjI0NTdDOC43MzA0MSAzMi4zNTI3IDkuNzU3NjQgMzQuMzczNCAxMS41ODYxIDM1Ljg2MzNDMTMuNDE0NiAzNy4zNTMyIDE1Ljg5NDUgMzguMTkwMiAxOC40ODA0IDM4LjE5MDJDMjEuMDY2MyAzOC4xOTAyIDIzLjU0NjIgMzcuMzUzMiAyNS4zNzQ3IDM1Ljg2MzNDMjcuMjAzMiAzNC4zNzM0IDI4LjIzMDQgMzIuMzUyNyAyOC4yMzA0IDMwLjI0NTdDMjguMjMwNCAyNC44Nzg2IDIyLjYwMzEgMjAuNDk1NiAyMC4xODQ0IDE4Ljg1NzFaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfNF82MykiPjwvcGF0aD4KICA8L2c+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNF82MyIgeDE9IjYuNSIgeTE9IjIyLjUiIHgyPSIyOSIgeTI9IjM5LjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI0VFNzc0NCI+PC9zdG9wPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFRUVFNDQiPjwvc3RvcD4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXAwXzRfNjMiPgogICAgICA8cmVjdCB3aWR0aD0iMzQiIGhlaWdodD0iNDIiIGZpbGw9IndoaXRlIj48L3JlY3Q+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KPC9zdmc+Cg==";
        const trophyIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOS4wNjI1IDIuNUg4LjEyNVYxLjg3NUM4LjEyNSAxLjc5MjEyIDguMDkyMDggMS43MTI2MyA4LjAzMzQ3IDEuNjU0MDNDNy45NzQ4NyAxLjU5NTQyIDcuODk1MzggMS41NjI1IDcuODEyNSAxLjU2MjVIMi4xODc1QzIuMTA0NjIgMS41NjI1IDIuMDI1MTMgMS41OTU0MiAxLjk2NjUzIDEuNjU0MDNDMS45MDc5MiAxLjcxMjYzIDEuODc1IDEuNzkyMTIgMS44NzUgMS44NzVWMi41SDAuOTM3NUMwLjc3MTc0IDIuNSAwLjYxMjc2OSAyLjU2NTg1IDAuNDk1NTU4IDIuNjgzMDZDMC4zNzgzNDggMi44MDAyNyAwLjMxMjUgMi45NTkyNCAwLjMxMjUgMy4xMjVWMy43NUMwLjMxMjUgNC4xNjQ0IDAuNDc3MTIgNC41NjE4MyAwLjc3MDE0NiA0Ljg1NDg1QzAuOTE1MjM3IDQuOTk5OTUgMS4wODc0OSA1LjExNTA0IDEuMjc3MDYgNS4xOTM1NkMxLjQ2NjYzIDUuMjcyMDggMS42Njk4MSA1LjMxMjUgMS44NzUgNS4zMTI1SDIuMDE3NThDMi4yMDE2NiA1Ljg5NTg2IDIuNTUyNjQgNi40MTI1MSAzLjAyNzE1IDYuNzk4NTdDMy41MDE2NiA3LjE4NDYzIDQuMDc4ODkgNy40MjMxOSA0LjY4NzUgNy40ODQ3N1Y4LjQzNzVIMy43NUMzLjY2NzEyIDguNDM3NSAzLjU4NzYzIDguNDcwNDIgMy41MjkwMyA4LjUyOTAzQzMuNDcwNDIgOC41ODc2MyAzLjQzNzUgOC42NjcxMiAzLjQzNzUgOC43NUMzLjQzNzUgOC44MzI4OCAzLjQ3MDQyIDguOTEyMzcgMy41MjkwMyA4Ljk3MDk3QzMuNTg3NjMgOS4wMjk1OCAzLjY2NzEyIDkuMDYyNSAzLjc1IDkuMDYyNUg2LjI1QzYuMzMyODggOS4wNjI1IDYuNDEyMzcgOS4wMjk1OCA2LjQ3MDk3IDguOTcwOTdDNi41Mjk1OCA4LjkxMjM3IDYuNTYyNSA4LjgzMjg4IDYuNTYyNSA4Ljc1QzYuNTYyNSA4LjY2NzEyIDYuNTI5NTggOC41ODc2MyA2LjQ3MDk3IDguNTI5MDNDNi40MTIzNyA4LjQ3MDQyIDYuMzMyODggOC40Mzc1IDYuMjUgOC40Mzc1SDUuMzEyNVY3LjQ4MzU5QzYuNTYwMTYgNy4zNTc0MiA3LjU5NTMxIDYuNDgyMDMgNy45NzE4OCA1LjMxMjVIOC4xMjVDOC41Mzk0IDUuMzEyNSA4LjkzNjgzIDUuMTQ3ODggOS4yMjk4NSA0Ljg1NDg1QzkuNTIyODggNC41NjE4MyA5LjY4NzUgNC4xNjQ0IDkuNjg3NSAzLjc1VjMuMTI1QzkuNjg3NSAyLjk1OTI0IDkuNjIxNjUgMi44MDAyNyA5LjUwNDQ0IDIuNjgzMDZDOS4zODcyMyAyLjU2NTg1IDkuMjI4MjYgMi41IDkuMDYyNSAyLjVaTTEuODc1IDQuNjg3NUMxLjYyNjM2IDQuNjg3NSAxLjM4NzkgNC41ODg3MyAxLjIxMjA5IDQuNDEyOTFDMS4wMzYyNyA0LjIzNzEgMC45Mzc1IDMuOTk4NjQgMC45Mzc1IDMuNzVWMy4xMjVIMS44NzVWNC4zNzVDMS44NzUgNC40NzkxNyAxLjg4MDA4IDQuNTgzMzMgMS44OTAyMyA0LjY4NzVIMS44NzVaTTcuNSA0LjMzOTg0QzcuNSA1LjcyNzM0IDYuMzY3MTkgNi44NjQ4NCA1IDYuODc1QzQuMzM2OTYgNi44NzUgMy43MDEwNyA2LjYxMTYxIDMuMjMyMjMgNi4xNDI3N0MyLjc2MzM5IDUuNjczOTMgMi41IDUuMDM4MDQgMi41IDQuMzc1VjIuMTg3NUg3LjVWNC4zMzk4NFpNOS4wNjI1IDMuNzVDOS4wNjI1IDMuOTk4NjQgOC45NjM3MyA0LjIzNzEgOC43ODc5MSA0LjQxMjlxQzguNjEyMSA0LjU4ODczIDguMzczNjQgNC42ODc1IDguMTI1IDQuNjg3NUg4LjEwNTQ3QzguMTE4MjkgNC41NzIwNiA4LjEyNDgxIDQuNDU2IDguMTI1IDQuMzM5ODRWMy4xMjVIOS4wNjI1VjMuNzVaIiBmaWxsPSIjNUM1QzVDIj48L3BhdGg+Cjwvc3ZnPgo=";
        const xIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOC4xNDQxNSA3LjQ4MDg3QzguMjMyMjEgNy41Njg5MyA4LjI4MTY5IDcuNjg4MzYgOC4yODE2OSA3LjgxMjlDOC4yODE2OSA3LjkzNzQzIDguMjMyMjEgOC4wNTY4NyA4LjE0NDE1IDguMTQ0OTNDOC4wNTYwOSA4LjIzMjk5IDcuOTM2NjYgOC4yODI0NiA3LjgxMjEyIDguMjgyNDZDNy42ODc1OSA4LjI4MjQ2IDcuNTY4MTUgOC4yMzI5OSA3LjQ4MDA5IDguMTQ0OTNMNS4wMDAwMSA1LjY2NDA3TDIuNTE5MTUgOC4xNDQxNUMyLjQzMTA5IDguMjMyMjEgMi4zMTE2NiA4LjI4MTY4IDIuMTg3MTIgOC4yODE2OEMyLjA2MjU5IDguMjgxNjggMS45NDMxNSA4LjIzMjIxIDEuODU1MDkgOC4xNDQxNUMxLjc2NzAzIDguMDU2MDkgMS43MTc1NiA3LjkzNjY1IDEuNzE3NTYgNy44MTIxMkMxLjcxNzU2IDcuNjg3NTggMS43NjcwMyA3LjU2ODE1IDEuODU1MDkgNy40ODAwOUw0LjMzNTk1IDUuMDAwMDFMMS44NTU4NyAyLjUxOTE1QzEuNzY3ODEgMi40MzEwOSAxLjcxODM0IDIuMzExNjUgMS43MTgzNCAyLjE4NzEyQzEuNzE4MzQgMi4wNjI1OCAxLjc2NzgxIDEuOTQzMTUgMS44NTU4NyAxLjg1NTA5QzEuOTQzOTMgMS43NjcwMyAyLjA2MzM3IDEuNzE3NTUgMi4xODc5IDEuNzE3NTVDMi4zMTI0NCAxLjcxNzU1IDIuNDMxODggMS43NjcwMyAyLjUxOTk0IDEuODU1MDlMNS4wMDAwMSA0LjMzNTk0TDcuNDgwODcgMS44NTQ2OUM3LjU2ODkzIDEuNzY2NjMgNy42ODgzNyAxLjcxNzE2IDcuODEyOSAxLjcxNzE2QzcuOTM3NDQgMS43MTcxNiA4LjA1Njg3IDEuNzY2NjMgOC4xNDQ5MyAxLjg1NDY5QzguMjMyOTkgMS45NDI3NSA4LjI4MjQ3IDIuMDYyMTkgOC4yODI0NyAyLjE4NjczQzguMjgyNDcgMi4zMTEyNiA4LjIzMjk5IDIuNDMwNyA4LjE0NDkzIDIuNTE4NzZMNS42NjQwOCA1LjAwMDAxTDguMTQ0MTUgNy40ODA4N1oiIGZpbGw9IiMyRTJFMkUiPjwvcGF0aD4KPC9zdmc+Cg==";
        const ArrowClockIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOS4zNzQ5OSAyLjE4NzUxVjQuMDYyNTFDOS4zNzQ5OSA0LjE0NTQgOS4zNDIwNyA0LjIyNDg4IDkuMjgzNDYgNC4yODM0OUM5LjIyNDg2IDQuMzQyMDkgOS4xNDUzNyA0LjM3NTAxIDkuMDYyNDkgNC4zNzUwMUg3LjE4NzQ5QzcuMTA0NjEgNC4zNzUwMSA3LjAyNTEzIDQuMzQyMDkgNi45NjY1MiA0LjI4MzQ5QzYuOTA3OTIgNC4yMjQ4OCA2Ljg3NDk5IDQuMTQ1NCA2Ljg3NDk5IDQuMDYyNTFDNi44NzQ5OSAzLjk3OTYzIDYuOTA3OTIgMy45MDAxNSA2Ljk2NjUyIDMuODQxNTRDNy4wMjUxMyAzLjc4Mjk0IDcuMTA0NjEgMy43NTAwMSA3LjE4NzQ5IDMuNzUwMDFIOC4yNTc4MUw3LjIxOTEzIDIuNzk4NDVMNy4yMDkzNyAyLjc4OTA4QzYuNzc1MDIgMi4zNTQ4OSA2LjIyMjM3IDIuMDU4MzIgNS42MjA0NCAxLjkzNjRDNS4wMTg1MiAxLjgxNDQ4IDQuMzk0MDIgMS44NzI2MyAzLjgyNDk1IDIuMTAzNTdDMy4yNTU4OCAyLjMzNDUxIDIuNzY3NDggMi43MjgwMiAyLjQyMDc1IDMuMjM0OTJDMi4wNzQwMiAzLjc0MTgzIDEuODg0MzQgNC4zMzk2NiAxLjg3NTQxIDQuOTUzNzRDMS44NjY0NyA1LjU2NzgyIDIuMDM4NjggNi4xNzA5MiAyLjM3MDUxIDYuNjg3N0MyLjcwMjM1IDcuMjA0NDggMy4xNzkxIDcuNjEyMDIgMy43NDEyMSA3Ljg1OTQzQzQuMzAzMzEgOC4xMDY4MyA0LjkyNTg2IDguMTgzMTIgNS41MzEwOCA4LjA3ODc2QzYuMTM2MjkgNy45NzQ0MSA2LjY5NzM0IDcuNjk0MDMgNy4xNDQxMyA3LjI3MjY3QzcuMjA0MzggNy4yMTU2OSA3LjI4NDc5IDcuMTg0OTggNy4zNjc2OCA3LjE4NzI4QzcuNDUwNTcgNy4xODk1OSA3LjUyOTE1IDcuMjI0NzMgNy41ODYxMyA3LjI4NDk4QzcuNjQzMTEgNy4zNDUyMiA3LjY3MzgyIDcuNDI1NjMgNy42NzE1MSA3LjUwODUyQzcuNjY5MjEgNy41OTE0MSA3LjYzNDA2IDcuNjY5OTkgNy41NzM4MiA3LjcyNjk3QzYuODc5MDggOC4zODU4NSA1Ljk1NzQ4IDguNzUyMTcgNC45OTk5OSA4Ljc1MDAxSDQuOTQ4NDNDNC4zMzQyNyA4Ljc0MTYgMy43MzE1NyA4LjU4MjQ2IDMuMTkzMzEgOC4yODY1N0MyLjY1NTA2IDcuOTkwNjggMi4xOTc3MiA3LjU2NzExIDEuODYxNSA3LjA1MzA4QzEuNTI1MjggNi41MzkwNiAxLjMyMDQ3IDUuOTUwMzEgMS4yNjUwNyA1LjMzODU5QzEuMjA5NjcgNC43MjY4NyAxLjMwNTM4IDQuMTEwOTEgMS41NDM3OSAzLjU0NDg0QzEuNzgyMTkgMi45Nzg3NyAyLjE1NTk5IDIuNDc5OTMgMi42MzIzMyAyLjA5MjE2QzMuMTA4NjggMS43MDQzOSAzLjY3Mjk4IDEuNDM5NTYgNC4yNzU2NCAxLjMyMDk1QzQuODc4MyAxLjIwMjM0IDUuNTAwODcgMS4yMzM1OCA2LjA4ODYzIDEuNDExOTJDNi42NzYzOSAxLjU5MDI3IDcuMjExMzUgMS45MTAyNiA3LjY0NjQ4IDIuMzQzNzZMOC43NDk5OSAzLjM1MTU4VjIuMTg3NTFDOC43NDk5OSAyLjEwNDYzIDguNzgyOTIgMi4wMjUxNSA4Ljg0MTUyIDEuOTY2NTRDOC45MDAxMyAxLjkwNzk0IDguOTc5NjEgMS44NzUwMSA5LjA2MjQ5IDEuODc1MDFDOS4xNDUzNyAxLjg3NTAxIDkuMjI0ODYgMS45MDc5NCA5LjI4MzQ2IDEuOTY2NTRDOS4zNDIwNyAyLjAyNTE1IDkuMzc0OTkgMi4xMDQ2MyA5LjM3NDk5IDIuMTg3NTFaIiBmaWxsPSIjMkUyRTJFIj48L3BhdGg+Cjwvc3ZnPgo=';
        const bookmarkIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNNy4xODc1IDEuMjVIMi44MTI1QzIuNjQ2NzQgMS4yNSAyLjQ4Nzc3IDEuMzE1ODUgMi4zNzA1NiAxLjQzMzA2QzIuMjUzMzUgMS41NTAyNyAyLjE4NzUgMS43MDkyNCAyLjE4NzUgMS44NzVWOC43NUMyLjE4NzUzIDguODA1NzcgMi4yMDI0OCA4Ljg2MDUyIDIuMjMwOCA4LjkwODU2QzIuMjU5MTMgOC45NTY2IDIuMjk5NzkgOC45OTYxOCAyLjM0ODU4IDkuMDIzMjFDMi4zOTczNiA5LjA1MDIzIDIuNDUyNDkgOS4wNjM3MSAyLjUwODI0IDkuMDYyMjRDMi41NjM5OSA5LjA2MDc3IDIuNjE4MzMgOS4wNDQ0IDIuNjY1NjIgOS4wMTQ4NEw1IDcuNTU1ODZMNy4zMzQ3NyA5LjAxNDg0QzcuMzgyMDUgOS4wNDQzIDcuNDM2MzUgOS4wNjA1OCA3LjQ5MjA0IDkuMDYyQzcuNTQ3NzMgOS4wNjM0MiA3LjYwMjc5IDkuMDQ5OTIgNy42NTE1MiA5LjAyMjkxQzcuNzAwMjQgOC45OTU5IDcuNzQwODYgOC45NTYzNiA3Ljc2OTE2IDguOTA4MzdDNy43OTc0NyA4Ljg2MDM5IDcuODEyNDMgOC44MDU3MSA3LjgxMjUgOC43NVYxLjg3NUM3LjgxMjUgMS43MDkyNCA3Ljc0NjY1IDEuNTUwMjcgNy42Mjk0NCAxLjQzMzA2QzcuNTEyMjMgMS4zMTU4NSA3LjM1MzI2IDEuMjUgNy4xODc1IDEuMjVaTTcuMTg3NSA4LjE4NjMzTDUuMTY1MjMgNi45MjI2NkM1LjExNTU3IDYuODkxNjEgNS4wNTgxOCA2Ljg3NTE2IDQuOTk5NjEgNi44NzUxNkM0Ljk0MTA0IDYuODc1MTYgNC44ODM2NSA2Ljg5MTYxIDQuODMzOTggNi45MjI2NkwyLjgxMjUgOC4xODYzM1YxLjg3NUg3LjE4NzVWOC4xODYzM1oiIGZpbGw9IiM1QzVDNUMiPjwvcGF0aD4KPC9zdmc+Cg==';
        const bookIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOS4wNjI1IDEuODc1SDYuMjVDNi4wMDc0MyAxLjg3NSA1Ljc2ODE5IDEuOTMxNDggNS41NTEyMyAyLjAzOTk2QzUuMzM0MjcgMi4xNDg0NCA1LjE0NTU0IDIuMzA1OTQgNSAyLjVDNC44NTQ0NiAyLjMwNTk0IDQuNjY1NzMgMi4xNDg0NCA0LjQ0ODc3IDIuMDM5OTZDNC4yMzE4MSAxLjkzMTQ4IDMuOTkyNTcgMS44NzUgMy43NSAxLjg3NUgwLjkzNzVDMC44NTQ2MiAxLjg3NSAwLjc3NTEzNCAxLjkwNzkyIDAuNzE2NTI5IDEuOTY2NTNDMC42NTc5MjQgMi4wMjUxMyAwLjYyNSAyLjEwNDYyIDAuNjI1IDIuMTg3NVY3LjgxMjVDMC42MjUgNy44OTUzOCAwLjY1NzkyNCA3Ljk3NDg3IDAuNzE2NTI5IDguMDMzNDdDMC43NzUxMzQgOC4wOTIwOCAwLjg1NDYyIDguMTI1IDAuOTM3NSA4LjEyNUgzLjc1QzMuOTk4NjQgOC4xMjUgNC4yMzcxIDguMjIzNzcgNC40MTI5MSA4LjM5OTU5QzQuNTg4NzMgOC41NzU0IDQuNjg3NSA4LjgxMzg2IDQuNjg3NSA5LjA2MjVDNC42ODc1IDkuMTQ1MzggNC43MjA0MiA5LjIyNDg3IDQuNzc5MDMgOS4yODM0N0M0LjgzNzYzIDkuMzQyMDggNC45MTcxMiA5LjM3NSA1IDkuMzc1QzUuMDgyODggOS4zNzUgNS4xNjIzNyA5LjM0MjA4IDUuMjIwOTcgOS4yODM0N0M1LjI3OTU4IDkuMjI0ODcgNS4zMTI1IDkuMTQ1MzggNS4zMTI1IDkuMDYyNUM1LjMxMjUgOC44MTM4NiA1LjQxMTI3IDguNTc1NCA1LjU4NzA5IDguMzk5NTlDNS43NjI5IDguMjIzNzcgNi4wMDEzNiA4LjEyNSA2LjI1IDguMTI1SDkuMDYyNUM5LjE0NTM4IDguMTI1IDkuMjI0ODcgOC4wOTIwOCA5LjI4MzQ3IDguMDMzNDdDOS4zNDIwOCA3Ljk3NDg3IDkuMzc1IDcuODk1MzggOS4zNzUgNy44MTI1VjIuMTg3NUM5LjM3NSAyLjEwNDYyIDkuMzQyMDggMi4wMjUxMyA5LjI4MzQ3IDEuOTY2NTNDOS4yMjQ4NyAxLjkwNzkyIDkuMTQ1MzggMS44NzUgOS4wNjI1IDEuODc1Wk0zLjc1IDcuNUgxLjI1VjIuNUgzLjc1QzMuOTk4NjQgMi41IDQuMjM3MSAyLjU5ODc3IDQuNDEyOTEgMi43NzQ1OUM0LjU4ODczIDIuOTUwNCA0LjY4NzUgMy4xODg4NiA0LjY4NzUgMy40Mzc1VjcuODEyNUM0LjQxNzI5IDcuNjA5MTcgNC4wODgxNyA3LjQ5OTQ2IDMuNzUgNy41Wk04Ljc1IDcuNUg2LjI1QzUuOTExODMgNy40OTk0NiA1LjU4MjcxIDcuNjA5MTcgNS4zMTI1IDcuODEyNVYzLjQzNzVDNS4zMTI1IDMuMTg4ODYgNS40MTEyNyAyLjk1MDQgNS41ODcwOSAyLjc3NDU5QzUuNzYyOSAyLjU5ODc3IDYuMDAxMzYgMi41IDYuMjUgMi41SDguNzVWNy41WiIgZmlsbD0iIzVDNUM1QyI+PC9wYXRoPgo8L3N2Zz4K";
        const checkIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOS4wODE2NSAzLjE0NDE0TDQuMDgxNjUgOC4xNDQxNEM0LjAzODExIDguMTg3ODQgMy45ODYzNiA4LjIyMjUxIDMuOTI5MzggOC4yNDYxN0MzLjg3MjQgOC4yNjk4MyAzLjgxMTMyIDguMjgyMDEgMy43NDk2MiA4LjI4MjAxQzMuNjg3OTMgOC4yODIwMSAzLjYyNjg0IDguMjY5ODMgMy41Njk4NiA4LjI0NjE3QzMuNTEyODkgOC4yMjI1MSAzLjQ2MTE0IDguMTg3ODQgMy40MTc1OSA4LjE0NDE0TDEuMjMwMDkgNS45NTY2NEMxLjE4NjQ5IDUuOTEzMDMgMS4xNTE5IDUuODYxMjcgMS4xMjgzIDUuODA0M0MxLjEwNDcxIDUuNzQ3MzMgMS4wOTI1NiA1LjY4NjI3IDEuMDkyNTYgNS42MjQ2QzEuMDkyNTYgNS41NjI5NCAxLjEwNDcxIDUuNTAxODggMS4xMjgzIDUuNDQ0OTFDMS4xNTE5IDUuMzg3OTQgMS4xODY0OSA1LjMzNjE4IDEuMjMwMDkgNS4yOTI1N0MxLjI3MzY5IDUuMjQ4OTcgMS4zMjU0NiA1LjIxNDM4IDEuMzgyNDMgNS4xOTA3OEMxLjQzOTQgNS4xNjcxOSAxLjUwMDQ2IDUuMTU1MDQgMS41NjIxMiA1LjE1NTA0QzEuNjIzNzkgNS4xNTUwNCAxLjY4NDg1IDUuMTY3MTkgMS43NDE4MiA1LjE5MDc4QzEuNzk4NzkgNS4yMTQzOCAxLjg1MDU1IDUuMjQ4OTcgMS44OTQxNSA1LjI5MjU3TDMuNzUwMDEgNy4xNDg0M0w4LjQxODM3IDIuNDgwODVDOC41MDY0MyAyLjM5Mjc5IDguNjI1ODcgMi4zNDMzMiA4Ljc1MDQgMi4zNDMzMkM4Ljg3NDk0IDIuMzQzMzIgOC45OTQzNyAyLjM5Mjc5IDkuMDgyNDMgMi40ODA4NUM5LjE3MDUgMi41Njg5MSA5LjIxOTk3IDIuNjg4MzUgOS4yMTk5NyAyLjgxMjg5QzkuMjE5OTcgMi45Mzc0MiA5LjE3MDUgMy4wNTY4NiA5LjA4MjQzIDMuMTQ0OTJMOS4wODE2NSAzLjE0NDE0WiIgZmlsbD0iI0U2RTZFNiI+PC9wYXRoPgo8L3N2Zz4K";
        const popcorIcon = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIiBmaWxsPSJub25lIj4KICA8cGF0aCBkPSJNOC45NjU2MiAyLjg5ODgyQzguOTI4OTMgMi44NjQzMSA4Ljg4NDQ0IDIuODM5MTkgOC44MzU5NSAyLjgyNTU5QzguNzg3NDYgMi44MTE5OSA4LjczNjM5IDIuODEwMzEgOC42ODcxMSAyLjgyMDY5QzguNjI2NDMgMi42MDI1NiA4LjUyMzI1IDIuMzk4NTYgOC4zODM0OSAyLjIyMDQyQzguMjQzNzMgMi4wNDIyOCA4LjA3MDE2IDEuODkzNTIgNy44NzI3MyAxLjc4MjY2QzcuNjc1MzEgMS42NzE4MSA3LjQ1NzkzIDEuNjAxMDUgNy4yMzMwOCAxLjU3NDQ2QzcuMDA4MjIgMS41NDc4OCA2Ljc4MDMzIDEuNTY1OTcgNi41NjI1IDEuNjI3NzJDNi40MjUzOSAxLjMyODUzIDYuMjA1MjcgMS4wNzQ5OSA1LjkyODI5IDAuODk3MjQxQzUuNjUxMyAwLjcxOTQ5IDUuMzI5MTEgMC42MjUgNSAwLjYyNUM0LjY3MDg5IDAuNjI1IDQuMzQ4NyAwLjcxOTQ5IDQuMDcxNzEgMC44OTcyNDFDMy43OTQ3MyAxLjA3NDk5IDMuNTc0NjEgMS4zMjg1MyAzLjQzNzUgMS42Mjc3MkMzLjIxOTcyIDEuNTY1ODkgMi45OTE4NiAxLjU0NzcgMi43NjcwMyAxLjU3NDE5QzIuNTQyMTkgMS42MDA2NyAyLjMyNDggMS42NzEzMSAyLjEyNzM1IDEuNzgyMDVDMS45Mjk4OSAxLjg5MjggMS43NTYyNiAyLjA0MTQ2IDEuNjE2NDMgMi4yMTk1QzEuNDc2NTkgMi4zOTc1NCAxLjM3MzMgMi42MDE0NSAxLjMxMjUgMi44MTk1MkMxLjI2MTE2IDIuODA4OTggMS4yMDggMi44MTE1MyAxLjE1NzkxIDIuODI2OTJDMS4xMDc4MSAyLjg0MjMxIDEuMDYyMzkgMi44NzAwNSAxLjAyNTgzIDIuOTA3NTlDMC45ODkyNjEgMi45NDUxMyAwLjk2MjcyMiAyLjk5MTI2IDAuOTQ4NjUzIDMuMDQxNzRDMC45MzQ1ODMgMy4wOTIyMiAwLjkzMzQzNSAzLjE0NTQzIDAuOTQ1MzEzIDMuMTk2NDdMMi4xMzkwNiA4LjI2ODM1QzIuMTcxMzggOC40MDU0NyAyLjI0OTA3IDguNTI3NjYgMi4zNTk1NCA4LjYxNTA4QzIuNDcwMDEgOC43MDI1MSAyLjYwNjc4IDguNzUwMDUgMi43NDc2NiA4Ljc0OTk5SDcuMjUyMzRDNy4zOTMyMiA4Ljc1MDA1IDcuNTI5OTkgOC43MDI1MSA3LjY0MDQ2IDguNjE1MDhDNy43NTA5MyA4LjUyNzY2IDcuODI4NjIgOC40MDU0NyA3Ljg2MDk0IDguMjY4MzVMOS4wNTQzIDMuMTk2NDdDOS4wNjY3NCAzLjE0MzQzIDkuMDY1MTEgMy4wODgwNiA5LjA0OTU2IDMuMDM1ODVDOS4wMzQgMi45ODM2NCA5LjAwNTA3IDIuOTM2NCA4Ljk2NTYyIDIuODk4ODJaTTIuOTY4NzUgMi4xODc0OUMzLjE0NzM1IDIuMTg2OTkgMy4zMjMyOSAyLjIzMDc0IDMuNDgwODYgMi4zMTQ4M0MzLjUyMzQgMi4zMzc0IDMuNTcwNTcgMi4zNDk4MiAzLjYxODcxIDIuMzUxMTVDMy42NjY4NCAyLjM1MjQ3IDMuNzE0NjMgMi4zNDI2NSAzLjc1ODM0IDIuMzIyNDZDMy44MDIwNiAyLjMwMjI3IDMuODQwNTEgMi4yNzIyNCAzLjg3MDcxIDIuMjM0NzRDMy45MDA5IDIuMTk3MjMgMy45MjIwMyAyLjE1MzI1IDMuOTMyNDIgMi4xMDYyNEMzLjk4NjUxIDEuODYzNDMgNC4xMjE3NiAxLjY0NjMyIDQuMzE1ODQgMS40OTA3MkM0LjUwOTkyIDEuMzM1MTIgNC43NTEyNCAxLjI1MDMyIDUgMS4yNTAzMkM1LjI0ODc2IDEuMjUwMzIgNS40OTAwOCAxLjMzNTEyIDUuNjg0MTYgMS40OTA3MkM1Ljg3ODI0IDEuNjQ2MzIgNi4wMTM0OSAxLjg2MzQzIDYuMDY3NTggMi4xMDYyNEM2LjA3Nzk3IDIuMTUzMjUgNi4wOTkxIDIuMTk3MjMgNi4xMjkyOSAyLjIzNDc0QzYuMTU5NDkgMi4yNzIyNCA2LjE5Nzk0IDIuMzAyMjcgNi4yNDE2NiAyLjMyMjQ2QzYuMjg1MzcgMi4zNDI2NSA2LjMzMzE2IDIuMzUyNDcgNi4zODEyOSAyLjM1MTE1QzYuNDI5NDMgMi4zNDk4MiA2LjQ3NjYgMi4zMzc0IDYuNTE5MTQgMi4zMTQ4M0M2LjY2Mzc5IDIuMjM4MSA2LjgyMzgyIDIuMTk0ODMgNi45ODc0MyAyLjE4ODIxQzcuMTUxMDQgMi4xODE1OCA3LjMxNDA1IDIuMjExNzggNy40NjQ0MyAyLjI3NjU2QzcuNjE0OCAyLjM0MTM1IDcuNzQ4NzIgMi40MzkwNyA3Ljg1NjI5IDIuNTYyNTJDNy45NjM4NiAyLjY4NTk3IDguMDQyMzQgMi44MzIgOC4wODU5NCAyLjk4OTgzTDYuNTc5NjkgMy40MTk1Mkw1LjIzMjQyIDIuODgwNDZDNS4wODM0NyAyLjgyMDkgNC45MTczMSAyLjgyMDkgNC43NjgzNiAyLjg4MDQ2TDMuNDIwNyAzLjQyMDNMMS45MTQwNiAyLjk4OTgzQzEuOTc3ODQgMi43NTkxMSAyLjExNTU1IDIuNTU1NjggMi4zMDYwNiAyLjQxMDc1QzIuNDk2NTcgMi4yNjU4MSAyLjcyOTM3IDIuMTg3MzkgMi45Njg3NSAyLjE4NzQ5Wk0yLjc0NzY2IDguMTI0OTlMMS42NzYxNyAzLjU3MTg2TDMuMTU0NjkgMy45OTQxM0wzLjcwNTQ3IDguMTI0OTlIMi43NDc2NlpNNS42NjQwNiA4LjEyNDk5SDQuMzM1OTRMMy43NzkzIDMuOTQ5OTlMNSAzLjQ2MTcxTDYuMjIwNyAzLjk0OTk5TDUuNjY0MDYgOC4xMjQ5OVpNNy4yNTIzNCA4LjEyNDk5SDYuMjk0NTNMNi44NDUzMSAzLjk5NDEzTDguMzIzODMgMy41NzE4Nkw3LjI1MjM0IDguMTI0OTlaIiBmaWxsPSIjNUM1QzVDIj48L3BhdGg+Cjwvc3ZnPgo=";
        // #endregion Icons

        // #region: Styles
        const globalStyles = {
            background: 'var(--streak-background, #070707)',
            dark: 'var(--streak-dark, #1A1A1A)',
            border: 'var(--streak-border, #2E2E2E)',
            text200: 'var(--streak-text-200, #5C5C5C)',
            text100: 'var(--streak-text-100, #E6E6E6)',
            accent: 'var(--streak-accent, #6152DF)',
            font: 'var(--streak-font, inherit)',
        };

        const cssStyles = `
            div:has(> .streak-root), [role="dialog"]:has(.streak-root) {background-color: ${globalStyles.background} !important;}
            .streak-flame { background-image: url('${flameBase64}'); background-size: contain; background-repeat: no-repeat; background-position: center; aspect-ratio: 1/1; width: auto; height: 100%; }
            .streak-current-text { justify-content: space-between; height: 100%; }
            .streak-span { color: ${globalStyles.text200}; font-family: ${globalStyles.font}; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; width: auto; height: auto; }
            .streak-streak { display: flex; justify-content: flex-start; align-items: flex-end; flex-direction: row; gap: 0.75rem; }
            .streak-text { color: ${globalStyles.text100}; font-family: ${globalStyles.font}; font-size: 3.25rem; font-weight: 600; width: auto; height: auto; margin-bottom: 0.75rem; }
            .streak-info-item { display: flex; justify-content: flex-end; align-items: center; flex-direction: row; gap: 0.5rem; }
            .streak-info-item .streak-span { font-size: 1rem; text-transform: default; }
            .streak-info-icon { width: 1.5rem; height: auto; object-fit: contain; }
            .streak-icon { width: 1.125rem; height: auto; object-fit: contain; }
            .streak-day-container { align-items: center; justify-content: space-between; width: 100%; height: 5dvh; margin-top: 3.5dvh; display: flex; }
            .streak-day { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
            .streak-day-box { display: flex; align-items: center; justify-content: center; border-radius: 100000rem; width: 2.5rem; height: 2.5rem; }
            .streak-milestone-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.125rem }
            .streak-milestone-track { width: 100%; height: 1rem; background-color: ${globalStyles.dark}; border-radius: 9999rem; margin-bottom: 1rem; }
            .streak-milestone-fill { height: 100%; background-color: ${globalStyles.accent}; box-shadow: 0 0 16px 0 color-mix(in srgb, ${globalStyles.accent} 50%, transparent); border-radius: 9999rem; }
            .streak-milestone-row { display: flex; gap: 0.75rem; }
        `;

        // #endregion Styles

        // #region: UI
        const tray = ctx.newTray({
            iconUrl: "https://raw.githubusercontent.com/m0liveira/WeebStreak/main/WeebStreak/assets/weebstreak.png",
            withContent: true,
        });

        tray.render(() => {
            checkAndResetBrokenStreak();

            const data = getStoredData();
            const currentStreak = (data && data.currentStreaks) ? data.currentStreaks.general : 0;
            const currentMangaStreak = (data && data.currentStreaks) ? data.currentStreaks.manga : 0;
            const currentAnimeStreak = (data && data.currentStreaks) ? data.currentStreaks.anime : 0;
            const longestStreak = (data && data.longestStreaks) ? data.longestStreaks : 0;

            let now = new Date();
            now.setHours(now.getHours() - 4);

            let currentDayOfWeek = now.getDay();
            currentDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

            let dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let daysData = [];

            for (let i = 1; i <= 7; i++) {
                let d = new Date(now.getTime());
                d.setDate(now.getDate() - (currentDayOfWeek - i));

                let y = d.getFullYear();
                let m = padZero(d.getMonth() + 1);
                let dayNum = padZero(d.getDate());
                let dateStr = y + '-' + m + '-' + dayNum;

                let isCompleted = false;
                if (data.history && data.history.length > 0) {
                    for (let j = 0; j < data.history.length; j++) {
                        if (data.history[j].date === dateStr) {
                            isCompleted = true;
                            break;
                        }
                    }
                }

                let status = 'upcoming';
                if (i > currentDayOfWeek) {
                    status = 'upcoming';
                } else if (i === currentDayOfWeek) {
                    status = isCompleted ? 'completed' : 'today';
                } else {
                    status = isCompleted ? 'completed' : 'failed';
                }

                daysData.push({ label: dayLabels[i - 1], status: status });
            }

            let thresholds = [7, 14, 30, 60, 100, 200, 365, 500, 1000];
            let targetMilestone = 7;

            for (let k = 0; k < thresholds.length; k++) {
                if (currentStreak < thresholds[k]) {
                    targetMilestone = thresholds[k];
                    break;
                }
            }

            if (currentStreak >= 1000) {
                targetMilestone = currentStreak + (100 - (currentStreak % 100));
            }

            const milestonePercent = (currentStreak / targetMilestone) * 100;
            const displayTitle = (data && data.lastTitle && data.lastTitle !== "")
                ? data.lastTitle
                : "No activity yet";

            return tray.stack({
                className: 'streak-root',
                style: { backgroundColor: globalStyles.background, width: '100%', height: '100%', padding: '1.5rem' },
                items: [
                    tray.css(cssStyles),
                    tray.flex({
                        style: { justifyContent: 'space-between', height: '9dvh' },
                        items: [
                            tray.div({
                                style: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1.5rem' },
                                items: [
                                    tray.div({ className: "streak-flame", items: [] }),
                                    tray.stack({
                                        className: 'streak-current-text',
                                        items: [
                                            tray.span('Current streak', { className: 'streak-span' }),
                                            tray.div({
                                                className: 'streak-streak',
                                                items: [
                                                    tray.text(`${currentStreak}`, { className: 'streak-text', style: { color: 'white' } }),
                                                    tray.span('Days', { className: 'streak-span' }),
                                                ]
                                            })
                                        ],
                                    })
                                ]
                            }),
                            tray.stack({
                                style: { height: '100%', justifyContent: 'space-between', padding: '0.5rem 0' },
                                items: [
                                    tray.div({
                                        className: 'streak-info-item',
                                        items: [
                                            tray.span(`${currentAnimeStreak}`, { className: 'streak-span' }),
                                            tray.img({ src: popcorIcon, className: "streak-info-icon" })
                                        ],
                                    }),
                                    tray.div({
                                        className: 'streak-info-item',
                                        items: [
                                            tray.span(`${currentMangaStreak}`, { className: 'streak-span' }),
                                            tray.img({ src: bookIcon, className: "streak-info-icon" })
                                        ],
                                    }),
                                    tray.div({
                                        className: 'streak-info-item',
                                        items: [
                                            tray.span(`${longestStreak}`, { className: 'streak-span' }),
                                            tray.img({ src: trophyIcon, className: "streak-info-icon" })
                                        ],
                                    })
                                ]
                            })
                        ]
                    }),
                    tray.flex({
                        className: 'streak-day-container',
                        items: daysData.map(day => {
                            let bg = globalStyles.dark;
                            let border = `1px solid ${globalStyles.dark}`;
                            let shadow = `none`;
                            let iconText = '';
                            let today = '';

                            if (day.status === 'completed') {
                                bg = globalStyles.accent;
                                border = 'none';
                                shadow = `0 0 16px 0 color-mix(in srgb, ${globalStyles.accent} 50%, transparent)`;
                                iconText = checkIcon;
                            } else if (day.status === 'failed') {
                                iconText = xIcon;
                            } else if (day.status === 'today') {
                                border = `2px solid ${globalStyles.accent}`;
                                shadow = `0 0 16px 0 color-mix(in srgb, ${globalStyles.accent} 50%, transparent), inset 0 0 16px 0 color-mix(in srgb, ${globalStyles.accent} 50%, transparent)`;
                                bg = 'transparent';
                                today = globalStyles.text100;
                            }

                            return tray.div({
                                className: 'streak-day',
                                items: [
                                    tray.div({
                                        className: 'streak-day-box',
                                        style: { backgroundColor: bg, border: border, boxShadow: shadow },
                                        items: iconText !== '' ? [tray.img({ src: iconText, className: "streak-icon" })] : []
                                    }),
                                    tray.span(day.label, { className: 'streak-span', style: { color: today, fontWeight: '400', textTransform: 'Capitalize' } })
                                ]
                            });
                        })
                    }),
                    tray.stack({
                        style: { width: '100%', marginTop: '3dvh' },
                        items: [
                            tray.div({
                                className: 'streak-milestone-header',
                                items: [
                                    tray.span('Next Milestone', { className: 'streak-span' }),
                                    tray.span(`${currentStreak} / ${targetMilestone}`, { className: 'streak-span' })
                                ]
                            }),
                            tray.div({
                                className: 'streak-milestone-track',
                                items: [
                                    tray.div({ className: 'streak-milestone-fill', style: { width: `${milestonePercent}%` }, items: [] })
                                ]
                            }),
                            tray.div({
                                className: 'streak-milestone-row',
                                items: [
                                    tray.img({ src: bookmarkIcon, className: "streak-icon" }),
                                    tray.span('Kept The Streak:', { className: 'streak-span', style: { textTransform: 'Capitalize' } }),
                                    tray.span(displayTitle, {
                                        className: 'streak-span',
                                        style: { color: globalStyles.text100, marginLeft: '-0.25rem', textTransform: 'none' }
                                    })
                                ]
                            }),
                            tray.div({
                                className: 'streak-milestone-row',
                                style: { marginTop: '-0.25rem' },
                                items: [
                                    tray.img({ src: ArrowClockIcon, className: "streak-icon" }),
                                    tray.span('Day resets at 4:00 AM local time', {
                                        className: 'streak-span',
                                        style: { color: globalStyles.border, textTransform: 'none' }
                                    })
                                ]
                            })
                        ]
                    })
                ],
            })
        })
        // #endregion UI
    });
}