class Loader{
	constructor(baseLink, options){
		this.baseLink = baseLink,
		this.options = options
    }

	getResp( { endpoint, options = {}}, callback = () => {console.error('No callback for GET response')}){
		this._load('GET', endpoint, callback, options);
    }

    postResp( endpoint, callback = () => {console.error('No callback for POST response')}, options = {}){
		this._load('POST', endpoint, callback, options);
    }

    _errorHandler(res){
        alert(`Sorry, but there is ${res.status} error: ${res.statusText}`);
    }

    _load( method, endpoint, callback, options = {}){
		const urlOptions = { ...this.options, ...options };
		let url = `${this.baseLink}${endpoint}?`;
		for(let i in urlOptions) url += `${i}=${urlOptions[i]}&`;

        fetch(url.slice(0, -1),{method})
            .then(res => {
                if (!res.ok) {
                    if (res.status === 401 || res.status === 404) this._errorHandler(res);
                    throw Error(res.statusText);
                }
                return res;
            })
			.then(res => res.json())
			.then(data => callback(data))
			.catch(err => console.error(err));
    }
}
class AppLoader extends Loader{
	constructor(){
		super('https://newsapi.org/v2/', { apiKey: '67c1acd35f714c8da11288faf6e12bcf' });
	}
}
class AppController extends AppLoader{
    getSources(callback){
        super.getResp({ endpoint: 'sources' }, callback);
    }

    getNews(e, callback){
		let target = e.target;
		const newsContainer = e.currentTarget;

		while (target != newsContainer) {
			if (target.classList.contains('source__item')) {
				const sourceId = target.getAttribute('data-source-id');
				if(newsContainer.getAttribute('data-source') !== sourceId){
					newsContainer.setAttribute('data-source', sourceId);
					super.getResp({endpoint: 'everything',
								   options: { sources: sourceId }
								},callback);
				}
				return;
			}
			target = target.parentNode;
		}
	}
}
class News{
    constructor(){
        this.state;
    }

    set _newState(newState){
        this.state = newState;
    }

    draw(data){
        this._newState = data;
		let newsCount = (data.length >= 10) ? 10 : data.length;
		const fragment = document.createDocumentFragment();
		const newsItemTemp = document.querySelector('#newsItemTemp');

		for (let i = 0; i < newsCount; i++) {
			const item = data[i];
			const newsClone = newsItemTemp.content.cloneNode(true);

			if( i % 2 ) newsClone.querySelector('.news__item').classList.add('alt');

			newsClone.querySelector('.news__meta-photo').style.backgroundImage = `url(${item.urlToImage || 'img/news_placeholder.jpg'})`;
			newsClone.querySelector('.news__meta-author').textContent = item.author || item.source.name;
			newsClone.querySelector('.news__meta-date').textContent = item.publishedAt.slice(0,10).split('-').reverse().join('-');

			newsClone.querySelector('.news__description-title').textContent = item.title;
			newsClone.querySelector('.news__description-source').textContent = item.source.name;
			newsClone.querySelector('.news__description-content').textContent = item.description;
			newsClone.querySelector('.news__read-more a').setAttribute('href', item.url);

			fragment.appendChild(newsClone);
		}

		document.querySelector('.news').innerHTML = '';
		document.querySelector('.news').appendChild(fragment);
    }
}
class Sources{
    constructor(){
        this.state;
    }

    set _newState(newState){
        this.state = newState;
    }

    draw(data){
        this._newState = data;
		const fragment = document.createDocumentFragment();
		const sourceItemTemp = document.querySelector('#sourceItemTemp');

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			const sourceClone = sourceItemTemp.content.cloneNode(true);

			sourceClone.querySelector('.source__item-name').textContent = item.name;
			sourceClone.querySelector('.source__item').setAttribute('data-source-id', item.id);

			fragment.appendChild(sourceClone);
		}

		document.querySelector('.sources').appendChild(fragment);
	}
}
class AppView{
	constructor(){
		this.news = new News();
		this.sources = new Sources();
	}

    drawNews(data){
		this.news.draw(data.articles);
    }

    drawSources(data){
		this.sources.draw(data.sources);
	}
}
class App{
	constructor(){
		this.controller = new AppController();
		this.view = new AppView();
	}

	start(){
		document.querySelector('.sources')
			.addEventListener('click', e => this.controller.getNews(e, data => this.view.drawNews(data)));
		this.controller.getSources(data => this.view.drawSources(data));
	}
}
const app = new App();
app.start();
