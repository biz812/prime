import ActorComponent from "./util/ActorComponent.js";
import ItemComponent from "../item/ItemComponent.js";
import {Prime_V1, Refinement_V1} from "./legacy/Stats.v1.js";
import Util from "../util/Util.js";

class Stat extends ItemComponent {

    constructor(parent, item) {
        super(parent, item);
    }

    get customisable() {
        return !!this._itemSystemData.customisable;
    }

    get default() {
        return !!this._itemSystemData.default;
    }

    get statType() {
        return this._itemSystemData.statType;
    }

    get description() {
        return this._itemSystemData.description;
    }

    get title() {
        return this._itemData.name;
    }

    get sourceKey() {
        return this._itemSystemData.sourceKey;
    }

    get max() {
        return this._itemSystemData.max;
    }

    get related() {
        return [];
    }

    get value() {
        return this._itemSystemData.value;
    }

    set value(value) {
        if (value <= this.max && value >= 0) {
            this._itemSystemData.value = value;
            this._update();
        }
    }

    get cost() {
        const num = this.value;
        return (num === 0) ? 0 : ((num * (num + 1)) / 2);
    }
}

class Prime extends Stat {
    constructor(parent, item) {
        super(parent, item);
    }
}

class Refinement extends Stat {
    constructor(parent, item) {
        super(parent, item);
    }
}


class StatCollection extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    // at some point this needs to work out the correct values depending on the compendium.
    get statTypes() {
        return ['physical', 'mental', 'supernatural'];
    }

    get all() {
        return Object.fromEntries(this.statTypes.map(statType => [statType, this.getStatsForType(statType)]));
    }

    get cost() {
        return this._getTransformedItems().reduce((accumulator, stat) => accumulator + stat.cost, 0);
    }

    getStatsForType(statType) {
        return this._getTransformedItems().filter(stat => stat.statType === statType);
    }

    getStatById(id){
       return this._getTransformedItems().find((stat) => stat.id === id);
    }

    setStatValue({value, key}){
        const stat = this.getStatById(key);
        stat.value = value;
    }

    _getTransformedItems() {
        return [];
    }
}

class Primes extends StatCollection {

    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
        if (this._root.version === 1) {
            // TODO: Migrate: version 1 takes its data from the actor system data and not items.
            return Object.entries(this._actorSystemData.primes)
                    .map(statData => new Prime_V1(this, statData));
        }
        return this._root._getItemsByType('prime')
                .sort((one, two) => one.name.localeCompare(two.name))
                .map(item => new Prime(this, item));
    }
}

class Refinements extends StatCollection {
    constructor(parent) {
        super(parent);
    }

    _getTransformedItems() {
        if (this._root.version === 1) {
            // TODO: Migrate: version 1 takes its data from the actor system data and not items.
            return  Object.entries(this._actorSystemData.refinements)
                    .map(statData => new Refinement_V1(this, statData));
        }
        return this._root._getItemsByType('refinement')
                .sort((one, two) => one.name.localeCompare(two.name))
                .map(item => new Refinement(this, item));
    }
}


export default class Stats extends ActorComponent {
    constructor(parent) {
        super(parent);
    }

    /**
     * @return {Primes}
     */
    get primes() {
        return Util.getComponentLazily(this, 'primes', Primes);
    }

    /**
     * @return {Primes}
     */
    get refinements() {
        return Util.getComponentLazily(this, 'refinements', Refinements);
    }

    get sorted() {
        const primes = this.primes.all;
        const refinements = this.refinements.all;
        return Object.entries(primes).map(([statType, stats]) =>
            ({
                statType,
                primes: stats,
                refinements: refinements[statType],
                title: game.i18n.localize(`PRIME.stat_type_${statType}`),
            })
        );
    }
}