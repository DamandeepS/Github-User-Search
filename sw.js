(() => {
    self.addEventListener('install', (e) => {
        e.waitUntil(
            caches.open('gsu-cache-v5').then((cache) => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/index.html?homescreen=1',
                    '/?homescreen=1',
                    '/styles/index.css',
                    '/js/main.js',
                    '/styles/material.indigo-pink.min.css',
                    '/js/material.min.js',
                    '/images/card-bg/1.jpg',
                    '/images/card-bg/2.jpg',
                    '/images/card-bg/3.jpg',
                    '/images/card-bg/4.jpg',
                    '/images/card-bg/5.jpg',
                    '/images/icons/github-512x512.png',
                    '/images/icons/github-256x256.png',
                    '/images/icons/github-192x192.png',
                    '/images/push-on.png',
                    '/images/push-off.png',
                    '/images/rick-pickle.jpg',
                    'https://fonts.googleapis.com/icon?family=Material+Icons'
                ]);
            })
        );
    });


    self.addEventListener('activate', function(e) {
        console.log('[ServiceWorker] Activate');
        cacheName = 'github-avatar-cache';
        e.waitUntil(
            caches.delete('gsu-cache-v4')

        );
         return self.clients.claim();
    });

    self.addEventListener('fetch', (event) => {
        console.log(event.request.url);
        if (new URL(event.request.url).hostname === "api.github.com")
            event.respondWith(fetch(event.request));
        else
            event.respondWith(
                caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }

                    return caches.open('github-avatar-cache').then(cache => {
                        return fetch(event.request).then(response => {

                                return cache.put(event.request, response.clone()).then(() => {
                                    return response;
                                });

                        })
                    })
                }).catch(err => {
                    console.log('Oops, I\'ve failed you.', err);

                    if (event.request.url.indexOf('.githubusercontent.com') != -1) {
                        var myHeaders = new Headers();
                        myHeaders.append('cache-control', 'no-cache');
                        return caches.match('/images/rick-pickle.jpg').then(response => {
                            return response;
                        })
                    }
                    // 
                    else if (event.request.url.indexOf('api.github.com/search/users')) {
                        console.error('Failed for request: ', event.request);
                    }

                })
            );
    });


    self.addEventListener('sync', event => {
        if (event.tag.indexOf('search-') === 0) {
            const query = event.tag.substr(event.tag.indexOf('-') + 1, event.tag.length);
            console.log(event)
            console.log('Now we will search for ' + query);

            event.waitUntil(
                fetch('https://api.github.com/search/users?q=' + query).then(resp => (resp.json())).then(json => {
                    if (json) {
                        console.log(json, json['total_count']);
                        self.registration.showNotification(json['total_count'] + ' Results found for ' + query, {
                            body: 'Your search for ' + query + ' has ' + json['total_count'] + ' results, tap to view',
                            icon: '/images/icons/github-256x256.png',
                            badge: '/images/icons/github-256x256.png',
                            tag: 'search-' + query
                        })
                        return json;

                    }
                }))
        }
    });


    self.addEventListener('notificationclick', event => {
        if (event.notification.tag.indexOf('search-') === 0) {
            const query = event.notification.tag.substr(event.notification.tag.indexOf('-') + 1, event.notification.tag.length);
            event.notification.close();
            var targetClient, allClients;
            event.waitUntil (clients.matchAll().then(allClients => {
                if(!allClients || !allClients.length) {
                    if (clients.openWindow) {
                        return clients.openWindow('https://github-user-search.demo.damandeepsingh.com?search=' + query);
                    }
                }
                    
                else {
                    targetClient = allClients[0];
                    for(let client of allClients) {
                        if(client.focused)
                            targetClient = client;
                    }
                    targetClient.navigate('https://github-user-search.demo.damandeepsingh.com?search=' + query);
                    targetClient.focus();
                }
            }).catch(() => {

                    if (clients.openWindow) {
                        return clients.openWindow('https://github-user-search.demo.damandeepsingh.com?search=' + query);
                    }
            }));
        }
    })

})()