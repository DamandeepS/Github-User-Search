(() => {
    const queryInput = document.querySelector('#query-input'),
        searchBtn = document.querySelector('#search-btn'),
        suggestionList = document.querySelector('#search-suggestions'),
        favoritesList = document.querySelector('#favorites-list'),
        searchPanel = document.querySelector('#search-panel'),
        userInfoPanel = document.querySelector('#user-info-panel'),
        favoritesPanel = document.querySelector('#favorite-users-panel');

    var deferredPrompt;

    let mode = 'search'; //can be 'search' or 'favorite';

    const OAuthToken = '4a93e38d33c3868ad8f9525bd372cffc1c2d0f45'; //Token to be used for GITHUB APIs

    const myHeaders = (() => {
        var headers = new Headers();
        headers.append('Authorization', 'token ' + OAuthToken);
        return headers;
    })()

    const getUsersList = () => {
        const noResultsBanner = searchPanel.querySelector('.no-results-banner'),
            getResutsLaterBanner = searchPanel.querySelector('.get-results-later');
        noResultsBanner.classList.remove('hidden');
            getResutsLaterBanner.classList.add('hidden');
        let name = queryInput.value.trim();
        if (!name)
            return;
        const url = 'https://api.github.com/search/users?q=' + name;

        console.log(myHeaders);
        //Show Spinner
        showLoader();
        fetch(url, {
            method: 'GET',
            headers: myHeaders
        }).then((resp) => {
            return resp.json();
        }).then((json) => {
            if (json.items.length) {
                noResultsBanner.classList.add('hidden');
            }
            let list = '';
            for (let item of json.items) {
                const elem = `<div class="mdl-list__item search-item" data-login="` + item.login + `"
                                data-avatar-url="` + item.avatar_url + `">
                                <span class="mdl-list__item-primary-content">
                                                              <img class="material-icons mdl-list__item-avatar" src=` + item.avatar_url + `></i>
                                                              <span>` + item.login + `</span>
                                </span>
                                <a class="mdl-list__item-secondary-action favorite-btn" href="#"><i class="material-icons ` + isFavorite(item.login) + `">star</i></a>
                            </div>`;
                list += elem;
            }
            suggestionList.innerHTML = list;
            initializeSuggestionsList();

            userInfoPanel.classList.add('hidden');
            searchPanel.classList.remove('hidden');
            hideLoader();
        }).catch((error) => {
            console.log(error);
            noResultsBanner.classList.add('hidden');
            getResutsLaterBanner.classList.remove('hidden');
            //Hide Spinner
            suggestionList.innerHTML = '';
            hideLoader();
        })
    };

    const initialize = function () {
        window.onload = () => {
            document.body.classList.remove('loader-active');

            setTimeout(()=> {
                var searchQuery, profileQuery;

                if(location.search) {
                    searchQuery = new URLSearchParams(location.search).get('search');
                    profileQuery = new URLSearchParams(location.search).get('id');

                    window.history.pushState({}, document.title, "/" + "");
                }

                if(searchQuery) {
                    queryInput.parentElement.MaterialTextfield.change(searchQuery);
                    searchBtn.click();
                } else if(profileQuery) {
                    viewUserCard(profileQuery)
                }
            },100);

        }
        searchBtn.addEventListener('click', event => {
            getUsersList();
        })

        queryInput.addEventListener('keyup', event => {
            if (event.keyCode == '13') {
                searchBtn.click();
            } else {
                suggestionList.innerHTML = '';
            }
        });

        userInfoPanel.querySelector('.mdl-card__actions a.close').addEventListener('click', e => {

            userInfoPanel.classList.add('hidden');
            searchPanel.classList.add('hidden');
            favoritesPanel.classList.add('hidden');
            if (mode === 'search')
                searchPanel.classList.remove('hidden');
            else
                favoritesPanel.classList.remove('hidden');
        })

        var shareBtn = userInfoPanel.querySelector('.mdl-card__menu .share');
        //Share button event listener
        shareBtn.addEventListener('click', event => {
            //Web share API
            if (navigator.share)
                navigator.share({
                    title: userInfoPanel.querySelector('.fullname').textContent,
                    text: 'Hey checkout this cool Github User',
                    url: userInfoPanel.querySelector('.html-url').href
                })
                .then(() => {
                    console.info('Shared successfully.');
                })
                .catch(error => {
                    console.error('Error in sharing: ', error);
                })
            else {
                //Webshare fallback

                var elem = document.createElement('textarea');
                //elem.classList.add('invisible');
                document.body.appendChild(elem);
                elem.textContent = userInfoPanel.querySelector('.html-url').href;
                elem.select();
                try {
                    document.execCommand('copy');
                    alert('Profile URL has been copied to the clipboard!');
                } catch (err) {
                    alert('Share API not Supported');
                } finally {
                    elem.remove();
                }
            }
        });

        favoritesPanel.querySelector('.goto-search').addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            favoritesPanel.classList.add('hidden');
            searchPanel.classList.remove('hidden');
            mode = 'search';
        });

        for (var link of document.querySelectorAll('.show-favorites')) {
            link.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                showFavoriteList();
                var layout = document.querySelector('.mdl-layout').MaterialLayout;
                if (layout.drawer_.classList.contains('is-visible'))
                    layout.toggleDrawer();
            })
        }

        userInfoPanel.querySelector('.mdl-card__menu .favorite').addEventListener('click', e => {
            e.preventDefault();
            const id = userInfoPanel.querySelector('.login').textContent;
            addTofavorites(id, userInfoPanel.querySelector('.avatar').src);
            showFavoriteList();
            favoritesPanel.classList.add('hidden'); //Need to do as showFavoriteList shows the favorite panel

            if (isFavorite(id)) {
                userInfoPanel.querySelector('.favorite').classList.add('is-favorite');
            } else {
                userInfoPanel.querySelector('.favorite').classList.remove('is-favorite');
            }
        })


        window.addEventListener('beforeinstallprompt', e => {
          console.log('beforeinstallprompt Event fired');
          e.preventDefault();

          console.log(e.platforms); // e.g., ["web", "android", "windows"] 
          deferredPrompt = e;
          document.querySelector('.add-to-homescreen').classList.remove('hidden');

          return false;
        });

        document.querySelector('.add-to-homescreen').addEventListener('click', () => {
          if(deferredPrompt !== undefined) {
            // The user has had a positive interaction with our app and Chrome
            // has tried to prompt previously, so let's show the prompt.
            deferredPrompt.prompt();

            // Follow what the user has done with the prompt.
            deferredPrompt.userChoice.then(choiceResult => {

              console.log(choiceResult.outcome);

              if(choiceResult.outcome == 'dismissed') {                    //["dismissed", "installed"]
                console.log('User cancelled home screen install');
              }
              else {
                console.log('User added to home screen');
              }
              deferredPrompt = null;
            });
              document.querySelector('.add-to-homescreen').classList.add('hidden');
          }
        });



        if(Notification.permission == 'denied') {                //["granted", "default", "denied"]
            return;
        }
        const notificationBanner = searchPanel.querySelector('.get-results-later');
        notificationBanner.querySelector('.get-notification').classList.remove('hidden');

        searchPanel.querySelector('.get-results-later').addEventListener('click', event => {
            
            Notification.requestPermission().then(perm => {
                if(Notification.permission == 'granted') {
                    navigator.serviceWorker.ready.then(function(swRegistration) {
                      return swRegistration.sync.register('search-' + queryInput.value);
                    });
                    notificationBanner.classList.add('hidden');

                } else if(Notification.permission == 'denied') {
                    notificationBanner.querySelector('.get-notification').classList.add('hidden');
                } else {

                }
            }).catch(err => {
                alert(err)
            });

        })


    }

    const addTofavorites = (id, url) => {
        let items = localStorage.getItem('favorites');
        if (!items) {
            items = [];
        } else
            items = JSON.parse(items);
        console.log(items, id, url)
        if (!items.filter(user => (user.id == id)).length) {
            items.push({
                id,
                url
            });
        } else {
            items.splice(items.findIndex(item => (item.id == id)), 1);
        }
        localStorage.setItem('favorites', JSON.stringify(items));
        
        var icon = document.querySelector('.search-item[data-login=' + id + '] .favorite-btn > i');
        if (icon)
            if (icon.classList.contains('is-favorite'))
                icon.classList.remove('is-favorite');
            else
                icon.classList.add('is-favorite');
    }


    const initializeSuggestionsList = () => {
        const items = document.querySelectorAll('.search-item');
        for (let item of items) {
            const login = item.dataset['login'],
                url = item.dataset['avatarUrl'];
            //add event listener to each favorite-btn;
            if (item.querySelector('.favorite-btn'))
                item.querySelector('.favorite-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    addTofavorites(login, url);
                });

            //addEventListener to open user view

            item.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                //Have to write a method;
                viewUserCard(login)
            });
        }
    }

    const isFavorite = id => {
        let items = localStorage.getItem('favorites');
        if (!items) {
            return '';
        } else
            items = JSON.parse(items);
        if (items.findIndex(user => (user.id == id)) != -1) {
            return 'is-favorite';
        }
    }

    const viewUserCard = id => {
        suggestionList.innerHTML = '';
        const url = 'https://api.github.com/users/' + id;
        showLoader();
        fetch(url, {
            method: 'GET',
            headers: myHeaders
        }).then(resp => {
            return resp.json();
            //Hide Spinner
        }).then(json => {
            userInfoPanel.querySelector('img.avatar').src = json['avatar_url']
            userInfoPanel.querySelector('.fullname').textContent = json['name'] || json['login'];
            userInfoPanel.querySelector('.login').textContent = json['login'];
            userInfoPanel.querySelector('.followers').textContent = json['followers'];
            userInfoPanel.querySelector('.repos').textContent = json['public_repos'];
            userInfoPanel.querySelector('.bio').textContent = json['bio'];
            userInfoPanel.querySelector('.html-url').href = json['html_url'];

            if (isFavorite(id)) {
                userInfoPanel.querySelector('.favorite').classList.add('is-favorite');
            } else {
                userInfoPanel.querySelector('.favorite').classList.remove('is-favorite');
            }


            userInfoPanel.querySelector('.mdl-card__title').style.backgroundImage = 'url("/images/card-bg/' + Math.ceil(Math.random() * 5) + '.jpg")'


            searchPanel.classList.add('hidden');
            favoritesPanel.classList.add('hidden');
            userInfoPanel.classList.remove('hidden');
            hideLoader();

        }).catch(error => {
            console.error(error);
            //Hide Spinner
            userInfoPanel.classList.add('hidden');
            searchPanel.classList.add('hidden');
            favoritesPanel.classList.add('hidden');
            if(mode=='search')
                searchPanel.classList.remove('hidden');
            else
                favoritesPanel.classList.remove('hidden')
            hideLoader();

            //We have to add BG Sync for this.

        });
    }

    const showFavoriteList = () => {
        mode = 'favorite';
        favoritesPanel.classList.remove('hidden');
        searchPanel.classList.add('hidden');
        const noFavoritesBanner = favoritesPanel.querySelector('#no-favorites-banner');
        let favorites = localStorage.getItem('favorites');
        if (!favorites || !JSON.parse(favorites).length) {
            noFavoritesBanner.classList.remove('hidden');
            favoritesList.innerHTML = '';
            return;
        }
        favorites = JSON.parse(favorites);
        let list = '';
        for (let favorite of favorites) {
            var markup = `<div class="mdl-list__item search-item" data-login="` + favorite.id + `">
                                <span class="mdl-list__item-primary-content">
                                                              <img class="material-icons mdl-list__item-avatar" src=` + favorite.url + `></i>
                                                              <span>` + favorite.id + `</span>
                                </span>
                                <a class="mdl-list__item-secondary-action delete-btn" href="#"><i class="material-icons ">delete</i></a>
                            </div> `;
            list += markup;
        }
        favoritesList.innerHTML = list;
        noFavoritesBanner.classList.add('hidden');


        for (let item of favoritesPanel.querySelectorAll('.search-item')) {
            var btn = item.querySelector('a.delete-btn');
            const id = item.dataset['login'];


            btn.addEventListener('click', e => {
                console.log(favorites.findIndex(item => (item.id == id)));
                favorites.splice(favorites.findIndex(item => (item.id == id)), 1);
                console.log(favorites);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                e.preventDefault();
                e.stopPropagation();
                showFavoriteList();
            });
            item.addEventListener('click', e => {
                viewUserCard(id);
            })
        }
    }

    const showLoader = () => {
        document.body.classList.add('loader-active');
    }
    const hideLoader = () => {
        document.body.classList.remove('loader-active');
    }

    initialize();
})();
