import Migration from "./Migration.js";

export default class PrimeMigration_0_2_2_PrimeRefinementIdFix extends Migration {
    static get version() {
        return '0.2.2';
    }

    static async canMigrate() {
        return true;
    }

    static async Migrate() {
        const actors = game.actors.contents;
        for (const actorDoc of actors) {
            const embeddedItems = actorDoc.items;
            for(const embeddedItem of embeddedItems){
                if ((embeddedItem.type === 'prime') || (embeddedItem.type === 'refinement')) {
                    if ((embeddedItem.data.sourceKey && !embeddedItem.data.metadata.sourceKey)){
                        let itemData = embeddedItem.data;
                        if (!itemData.metadata.sourceKey) {
                            itemData.metadata.sourceKey = itemData.sourceKey;
                            embeddedItem.update(itemData);
                        }
                    }
                }
            }
        }
    }
}