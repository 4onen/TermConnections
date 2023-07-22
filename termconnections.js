class TermConnectionsGame {
    constructor(terms) {
        // Must only be called after DOMContentLoaded
        this.terms = terms;
        this.topic = terms.topic;

        {
            const title = `Term Connections: ${this.topic}`;
            document.getElementById('header-text').innerText = title;
            document.title = title;
        }

        if (terms.coverImage) {
            document.getElementById('game-content').style.backgroundImage = `url(${terms.coverImage})`;
        }

        const categories = Object.keys(terms);
        categories.splice(categories.indexOf('topic'), 1);
        categories.splice(categories.indexOf('coverImage'), 1);

        this.categories = categories;

        console.log(this)
    }
}


(async function () {
    const domReadyPromise = new Promise((resolve) => window.addEventListener('DOMContentLoaded', resolve));
    const termsReadyPromise = fetch('terms.json').then((response) => response.json());

    await Promise.all([domReadyPromise, termsReadyPromise]).then(([_, terms]) => {
        new TermConnectionsGame(terms);
    });
})();


