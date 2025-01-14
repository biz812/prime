import {getComponentLazily} from "../../util/support.js";
import Component from "../../util/Component.js";
import {EmbeddedDocumentMixin} from "../../util/DynFoundryMixins.js";
import StatItem from "../../item/types/StatItem.js";
import {PrimeItemManager} from "../../item/PrimeItemManager.js";
import {getter} from "../../util/dyn_helpers.js";

class Stat extends EmbeddedDocumentMixin(StatItem) {
    constructor(parent, item) {
        super(parent, item);
    }
}

class StatCollection extends Component {
    itemType;
    constructor(parent, itemType) {
        super(parent);
        this.itemType = itemType;
        getter(this, 'all', () =>
            Object.fromEntries(this.statTypes.map(statType => [statType, this.getStatsForType(statType)])), {cached:true});
        getter(this, 'cost', () =>
            this.allStats.reduce((accumulator, stat) => accumulator + stat.cost, 0)
        , {cached:true});
        getter(this, 'allStats', () => {
            const searchCriteria = {itemCollection:this.document.items,itemBaseTypes:this.itemType, sortItems:true};
            let items = PrimeItemManager.getItems(searchCriteria);
            const stats = items.map(item => new Stat(this, item));
            return stats;
            }, {cached:true});
    }

    // at some point this needs to work out the correct values depending on the compendium.
    get statTypes() {
        return ['physical', 'mental', 'supernatural'];
    }

    get all() {
        return Object.fromEntries(this.statTypes.map(statType => [statType, this.getStatsForType(statType)]));
    }

    get cost() {
        return this.allStats.reduce((accumulator, stat) => accumulator + stat.cost, 0);
    }

    getStatsForType(statType) {
        return this.allStats.filter(stat => stat.statType === statType);
    }

    getStatById(id){
       return this.allStats.find((stat) => stat.id === id);
    }

    displayStat({id}){
        this.getStatById(id).displaySource();
    }

    setStatValue({value, key}){
        const stat = this.getStatById(key);
        stat.unadjustedValue = value;
    }
}

class Primes extends StatCollection {

    constructor(parent) {
        super(parent, 'prime');
    }
}

class Refinements extends StatCollection {
    constructor(parent) {
        super(parent, 'refinement');
    }
}


export default class Stats extends Component {
    constructor(parent) {
        super(parent);
        getter(this, 'sorted', () => {
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
        }, {cached:true});
    }

    /**
     * @return {Primes}
     */
    get primes() {
        return getComponentLazily(this, 'primes', Primes);
    }

    /**
     * @return {Primes}
     */
    get refinements() {
        return getComponentLazily(this, 'refinements', Refinements);
    }
}