import DataManager from "./DataManager.js";
import Controller from "./Controller.js";
import JSONPathBuilder from "./JSONPathBuilder.js";

/**
 * Static models are global models used from within the application.
 */
export class StaticModel {
    static _staticModels = null;

    static registerStaticModel(name, model) {
        if (StaticModel._staticModels == null) {
            StaticModel._staticModels = {};
        }
        StaticModel._staticModels[name] = model;
        return StaticModel;
    }

    static appendStaticModel(model) {
        if (model.static == null && StaticModel._staticModels != null) {
            model.static = StaticModel._staticModels;
        }
        return StaticModel;
    }
}

class GlobalTypeRegistry {
    static registry = new Map();

    static register(modelName) {
        if (!GlobalTypeRegistry.registry.has(modelName)) {
            GlobalTypeRegistry.registry.set(modelName, new TypeRegistry());
            return true;
        }
        return false;
    }

    static getTypeRegistry(modelName) {
        return GlobalTypeRegistry.registry.get(modelName);
    }

    static get(modelName, typeName) {
        const typeRegistry = GlobalTypeRegistry.getTypeRegistry(modelName);
        if (typeRegistry == null) {
            return null;
        }
        return typeRegistry.get(typeName);
    }
}

class TypeRegistry {
    registry = new Map();
    _default = null;

    register(typeName, Type) {
        if (!this.registry.has(typeName)) {
            this.registry.set(typeName, Type)
        }
        return this;
    }

    default(Type) {
        this._default = Type;
        return this;
    }

    get(typeName) {
        return this.registry.get(typeName) || this._default;
    }
}

class DynModel {
    managed;
    dataManager;
    modelName;
    typeProperty;
    updateListeners;

    constructor(managed, modelName, typeProperty) {
        this.managed = managed;
        this.dataManager = new DataManager(this.managed);
        this.modelName = modelName;
        this.typeProperty = typeProperty
        this.updateListeners = new Map();
    }

    get typed() {
        if (this.typeProperty == null) {
            return this.managed;
        } else {
            const Type = GlobalTypeRegistry.get(this.modelName, this.managed[this.typeProperty]);
            if (Type == null) {
                return this.managed;
            }
            const type = new Type(this.managed);
            return type;
        }
    }

    get lastChangedTime(){
        return this.dataManager.lastChangedTime;
    }

    changeDetected() {
        this.dataManager.changeDetected();
    }

    /**
     * The base foundryData of any document, generally it follows a fixed structure, as defined by a schema.
     *
     * @see foundry.abstract.DocumentData.defineSchema()
     * @see ActorData.defineSchema()
     * @returns {foundry.abstract.DocumentData | {data}}
     */
    get foundryData() {
        return this.managed.data;
    }


    /**
     * gameSystem data is the freeform add whatever you want to data, it is generally based on the template set for the gameSystem.
     * Because it is defined by the schema, is not guaranteed to be there, however I can't see any document that doesn't use it,
     * @returns {Object}
     */
    get gameSystem() {
        return this.foundryData.data;
    }


    /**
     * @returns {JSONPathBuilder}
     */
    get foundryDataPath() {
        if (this._foundryDataPath == null) {
            this._foundryDataPath = JSONPathBuilder.from('data');
        }
        return this._foundryDataPath;
    }

    /**
     * @returns {JSONPathBuilder}
     */
    get gameSystemPath() {
        if (this._gameSystemPath == null) {
            this._gameSystemPath = this.foundryDataPath.with('data');
        }
        return this._gameSystemPath;
    }

    /**
     *
     * @param {JSONPathBuilder | string[] | string} pathComponents
     * @param {any} value
     * @returns {*}
     */
    write(pathComponents, value) {
        return this.dataManager.write(pathComponents, value);
    }

    registerUpdateListener(updateListener, before = true) {
        // a little cleanup, of any dangling references.
        this.updateListeners.forEach((value, listener, map) => {
            if (listener.deref() == null) {
                map.delete(listener);
            }
        });


        this.updateListeners.set(new WeakRef(updateListener), before);
    }

    executeUpdateListeners(isBefore) {

        Array.from(this.updateListeners.entries())
            .filter(([, before]) => before === isBefore)
            .map(([listener,]) => listener.deref())
            .filter(listener => listener != null)
            .forEach((listener) => listener.onUpdate());

    }
}

/**
 * @exports DynDocument
 * @param {foundry.abstract.Document} FoundryDocumentType
 * @param {string} modelName the name to use as the model, for the use by controllers.
 * @param {string} typeProperty the type we might want to mixin, on the application.
 * @returns {module:DynDocument~mixin}
 * @constructor
 */
export const DynDocumentMixin = (FoundryDocumentType, modelName = 'doc', typeProperty = undefined) =>

    /**
     * @mixin
     * @alias module:DynDocument~mixin
     * @extends foundry.abstract.Document
     */
    class extends FoundryDocumentType {
        get dyn() {
            if (this._dyn == null) {
                this._dyn = new DynModel(this, modelName, typeProperty);
                if (typeProperty != null && GlobalTypeRegistry.register(modelName)) {
                    this.registerDynTypes(GlobalTypeRegistry.getTypeRegistry(modelName));
                }
            }
            return this._dyn;
        }


        get dynTyped() {
            return this.dyn.typed;
        }

        registerDynTypes(registry) {
        }

        async _preUpdate(...args) {
            const result = await super._preUpdate(...args);
            this.dyn.executeUpdateListeners(true);
            return result;
        }

        _onUpdate(...args) {
            this.dyn.changeDetected();
            const result = super._onUpdate(...args);
            this.dyn.executeUpdateListeners(false);
            return result;
        }

        _onCreateEmbeddedDocuments(...args) {
            this.dyn.changeDetected();
            return super._onCreateEmbeddedDocuments(...args);
        }
        _onDeleteEmbeddedDocuments(...args) {
            this.dyn.changeDetected();
            return super._onDeleteEmbeddedDocuments(...args);
        }

        _onUpdateEmbeddedDocuments(...args) {
            this.dyn.changeDetected();
            return super._onUpdateEmbeddedDocuments(...args);
        }
    };

class DynView {
    controller;

    constructor(managed) {
        this.controller = new Controller(managed.dynModels);
    }

}

/**
 * @exports DynApplication
 * @param {Application} FoundryApplicationType
 * @param {string} viewName the name to use as the model, for the use by controllers.
 * @returns {module:DynApplication~mixin}
 * @constructor
 */
export const DynApplicationMixin = (FoundryApplicationType, viewName = 'sheet') =>

    /**
     * @mixin
     * @alias module:DynApplication~mixin
     * @extends Application
     */
    class extends FoundryApplicationType {

        get dyn() {
            if (this._dyn == null) {
                this._dyn = new DynView(this);
            }
            return this._dyn;
        }

        get dynModels() {
            if (this._dynModels == null) {
                const models = {};
                models[viewName] = this;
                const doc = this.document;
                if (doc && doc.dyn) {
                    models[doc.dyn.modelName] = doc.dyn.typed;
                }
                StaticModel.appendStaticModel(models);
                this._dynModels = models;
            }
            return this._dynModels;
        }


        /** @override */
        activateListeners(html) {
            super.activateListeners(html);
            this.dyn.controller.control(html);
        }

        /** @override */
        getData() {
            const dyn = this.dyn;
            const data = {...super.getData(), ...this.dynModels, dyn};
            return data;
        }

    };

/**
 * @template {Component | Document} T
 * @param {T} EmbeddedDocumentType
 */
export const EmbeddedDocumentMixin = (EmbeddedDocumentType) =>

    /**
     * @extends T
     */
    class extends EmbeddedDocumentType {
        owningComponent;
        owningDyn;

        constructor(owningComponent, embedded, ...rest) {
            super(embedded, ...rest);
            this.owningComponent = owningComponent;
            this.owningDyn = this.owningComponent.dyn;
        }

        write(pathComponents, value) {
            const lastValue = super.write(pathComponents, value);
            const embeddedDataManager = this.dyn.dataManager;
            this.owningDyn.dataManager.embedDirtyDataManager(embeddedDataManager);
            return lastValue;
        }

        async deleteItem(render=true) {
            const owningDoc = this.owningComponent.document;
            const itemDoc = this.document;
            // asynchronous
            return owningDoc.deleteEmbeddedDocuments('Item', [itemDoc.id], {render, renderSheet:render});

            // .then(() => {
            //     if(render) {
            //         const sheet = owningDoc.sheet;
            //         sheet.render();
            //     }
            // });
        }

        get _sourceKey() {
            return this.metadata.sourceKey;
        }

        get _customisable() {
            return !!this.metadata.customisable;
        }

        get _directory() {
            return ItemDirectory;
        }

        displaySource(document = this.document) {
            let documentToLoad = document;
            if (this._sourceKey != null && !this._customisable) {
                const original = this._directory.collection.get(this._sourceKey);
                if (original != null) {
                    documentToLoad = original;
                } else {
                    console.warn(`Unable to find original document ${this._sourceKey} when looking in:`, this._directory)
                }

            }
            this.display(documentToLoad);
        }

        display(document = this.document) {
            const sheet = document.sheet;
            if (sheet.rendered) {
                sheet.maximize();
                sheet.bringToTop();
            } else {
                sheet.render(true);
            }
        }
    };

