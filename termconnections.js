const OPTIONS = ["topic", "bgImage", "pageColor", "textColor"];

const REGIONAL_INDICATORS = [
    "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴", "🇵", "🇶", "🇷", "🇸", "🇹", "🇺", "🇻", "🇼", "🇽", "🇾", "🇿",
];

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


const retheme = (options) => {
    {
        let title = "Term Connections";
        if (options.topic) {
            title = `${options.topic}`;
        }
        document.getElementById('header-text').innerText = title;
        document.title = title;
    }

    if (options.bgImage) {
        const bgImage = options.bgImage
        document.getElementById('game-content').style.backgroundImage = `url(${bgImage})`;
    }

    if (options.pageColor) {
        const pageColor = new tinycolor(options.pageColor).toHsl();
        document.body.style.setProperty('--bg-color-dark', options.pageColor);
        const lightColor = Object.assign({}, pageColor);
        lightColor.l = Math.min(1.0, lightColor.l + 0.1);
        document.body.style.setProperty('--bg-color', tinycolor(lightColor).toString());
        const selectedColor = Object.assign({}, pageColor);
        selectedColor.l = Math.max(0.0, lightColor.l - 0.25);
        document.body.style.setProperty('--bg-selected-color', tinycolor(selectedColor).toString());
    }

    if (options.textColor) {
        document.body.style.setProperty('--text-color', options.textColor);
    }
}

const quickEl = (tag, ...children) => {
    const el = document.createElement(tag);
    if (children) {
        el.replaceChildren(...children);
    }
    return el;
}

const textNode = document.createTextNode.bind(document);

class TermConnectionsGame {
    constructor(terms) {
        // Must only be called after DOMContentLoaded

        /** @type: object */
        this.categories = terms.categories;
        /** @type: object */
        this.options = terms.options;

        retheme(this.options);

        this.game_board = document.getElementById('game-board');
        this.game_submit = document.getElementById('game-submit');
        this.game_mistake_counter = document.getElementById('game-mistake-counter');
        this.game_report_attempts = document.getElementById('game-report-attempts');

        this.category_size = this.categories[Object.keys(this.categories)[0]].length;
        for (const category of Object.keys(this.categories)) {
            if (!(this.categories[category].length === this.category_size)) {
                throw new Error(`All categories must have the same number of terms. ${category} has ${this.categories[category].length} terms, but the first category has ${this.category_size} terms.`);
            }
        }
        this.game_board.style.setProperty('--grid-count', this.category_size);

        {
            // TODO: Load game state from localStorage
            const term_elements = Object.keys(this.categories).flatMap((category) => {
                return this.categories[category].map(this.termElFor.bind(this));
            });

            this.game_board.replaceChildren(...shuffle(term_elements));
        }

        document.getElementById('game-shuffle').addEventListener('click', () => {
            const term_elements = document.getElementById('game-board').children;
            this.game_board.replaceChildren(...shuffle(new Array(...term_elements)));
        });

        this.attempts = [];

        this.game_submit.addEventListener('click', () => {
            this.game_submit.disabled = true;
            const selected_term_els = this.get_selected_els();
            if (selected_term_els.length !== this.category_size) {
                // TODO: Play a rejection animation
                return;
            } else {
                const terms = this.get_selected_terms(selected_term_els);
                // By the end, we should find one category that all the terms are in
                // If we don't, then the user has made a mistake and we should reject
                let category_set = this.get_term_categories(terms[0]);
                for (const term of terms) {
                    const term_categories = this.get_term_categories(term);
                    category_set = category_set.filter((category) => term_categories.includes(category));
                    if (category_set.length <= 0) {
                        // Since we know it's wrong, we can just replace the terms with any one of their categories
                        const first_term_categories = terms.map((term) => this.get_term_categories(term)[0]);
                        this.attempts.push(first_term_categories);
                        this.game_mistake_counter.innerText = `Mistakes: ${this.get_mistake_count()}`;
                        // TODO: Play a rejection animation
                        return;
                    }
                }
                if (category_set.length !== 1) {
                    console.warn(`Found ${category_set.length} categories for terms ${terms.join(', ')}. Picking one at random.`);
                }

                const first_category = category_set[0];

                this.attempts.push(new Array(this.category_size).fill(first_category));

                const term_elements = new Array(...document.getElementById('game-board').children);
                const deselected_term_elements = term_elements.filter((el) => !el.classList.contains('selected'));
                const new_category_el = this.categoryElFor(first_category);

                this.game_board.replaceChildren(new_category_el, ...deselected_term_elements);
            }
        });

        document.getElementById('game-report-button').addEventListener('click', () => {
            this.game_mistake_counter.innerText = `Mistakes: ${this.get_mistake_count()}`;

            const category_emoji_map = new Map(this.get_solved_categories().map((category) => {
                return [category, this.get_category_emoji(category)];
            }));
            const report = this.attempts.map((attempt) => {
                const solved = attempt.every((category) => category === attempt[0]);
                const solved_emoji = solved ? "✅" : "❌";
                return quickEl("p", textNode(solved_emoji), textNode('|'), textNode(attempt.map((category) => category_emoji_map.get(category) ?? "🔘").join(" ")));
            });
            this.game_report_attempts.replaceChildren(...report);
        });
    }

    get_solved_categories() {
        return this.attempts.filter((attempt) => attempt.every((category) => category === attempt[0])).map((attempt) => attempt[0]);
    }

    get_solved_count() {
        return this.get_solved_categories().length;
    }

    get_mistake_count() {
        return this.attempts.length - this.get_solved_count();
    }


    get_term_categories(term) {
        const term_categories = [];
        for (const category of Object.keys(this.categories)) {
            if (this.categories[category].includes(term)) {
                term_categories.push(category);
            }
        }
        return term_categories;
    }

    get_selected_els() {
        return this.game_board.getElementsByClassName('selected');
    }

    get_selected_terms(els) {
        els = els || this.get_selected_els();
        if (!Array.isArray(els)) {
            els = [...els];
        }
        return els.map((el) => el.innerText);
    }

    updateSubmitButton() {
        this.game_submit.disabled = !(this.get_selected_els().length === this.category_size);
    }

    get_category_index(category) {
        const category_index = Object.keys(this.categories).indexOf(category);
        console.assert(category_index >= 0, `Category ${category} not found in categories ${Object.keys(this.categories)}`);
        return category_index;
    }

    get_category_emoji(category) {
        if (typeof category === 'string' || category instanceof String) {
            category = this.get_category_index(category);
        }
        return REGIONAL_INDICATORS[category];
    }

    categoryElFor(category) {
        const category_index = this.get_category_index(category);
        const category_emoji = this.get_category_emoji(category_index);
        const terms = this.categories[category];
        const category_el = quickEl(
            'div',
            quickEl('h3', textNode(category)),
            ...terms.map((term) => quickEl('div', textNode(term))),
        )
        category_el.setAttribute('data-indicator', category_emoji);
        category_el.classList.add('category');
        category_el.style.order = category_index - 1 - this.category_size;
        return category_el;
    }

    termEventHandler(evt) {
        const el = evt.target;
        if (el.classList.contains('selected')) {
            el.classList.remove('selected');
        } else {
            if (this.get_selected_els().length >= this.category_size) {
                // TODO: Play a rejection animation
            } else {
                el.classList.add('selected');
            }
        }
        this.updateSubmitButton();
    }

    termElFor(term) {
        const el = quickEl('div', textNode(term));
        el.addEventListener('click', this.termEventHandler.bind(this));
        el.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' || evt.key === ' ') {
                evt.preventDefault();
                this.termEventHandler(evt);
            }
        });
        el.setAttribute('tabindex', 0)
        el.classList.add('term');
        return el;
    }
}


const get_args = async function () {
    if (window.tc_game_args) {
        return window.tc_game_args;
    }

    return await fetch('terms.json').then((response) => response.json());
};



(async function () {
    const domReadyPromise = new Promise((resolve) => window.addEventListener('DOMContentLoaded', resolve));
    const argsReadyPromise = get_args();

    await Promise.all([domReadyPromise, argsReadyPromise]).then(([_, args]) => {
        new TermConnectionsGame(args);
    });
})();


