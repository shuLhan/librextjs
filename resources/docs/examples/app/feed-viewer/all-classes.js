/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Layout class for {@link Ext.form.field.Trigger} fields. Adjusts the input field size to accommodate
 * the trigger button(s).
 * @private
 */
Ext.define('Ext.layout.component.field.Trigger', {

    /* Begin Definitions */

    alias: 'layout.triggerfield',

    extend:  Ext.layout.component.field.Field ,

    /* End Definitions */

    type: 'triggerfield',

    // Private. Cached extra width values containing width of all a trigger field's "furniture" round the actual input element
    borderWidths: {},

    beginLayout: function(ownerContext) {
        var me = this,
            owner = me.owner,
            flags;

        ownerContext.triggerWrap = ownerContext.getEl('triggerWrap');

        me.callParent(arguments);

        // if any of these important states have changed, sync them now:
        flags = owner.getTriggerStateFlags();
        if (flags != owner.lastTriggerStateFlags) {
            owner.lastTriggerStateFlags = flags;
            me.updateEditState();
        }
    },
    
    beginLayoutCycle: function(ownerContext){
        this.callParent(arguments);
        
        // Clear width, in case a previous layout cycle set an explicit width.
        if (ownerContext.widthModel.shrinkWrap && !this.owner.inputWidth) {
            ownerContext.inputContext.el.setStyle('width', '');
        }    
    },

    beginLayoutFixed: function (ownerContext, width, suffix) {
        var me = this,
            owner = ownerContext.target,
            ieInputWidthAdjustment = me.ieInputWidthAdjustment || 0,
            inputWidth = '100%',
            triggerWrap = owner.triggerWrap;

        me.callParent(arguments);

        owner.inputCell.setStyle('width', '100%');
        if(ieInputWidthAdjustment) {
            me.adjustIEInputPadding(ownerContext);
            if(suffix === 'px') {
                if (owner.inputWidth) {
                    inputWidth = owner.inputWidth - me.getExtraWidth(ownerContext);
                } else {
                    inputWidth = width - ieInputWidthAdjustment - me.getExtraWidth(ownerContext);
                }
                inputWidth += 'px';
            }
        }
        owner.inputEl.setStyle('width', inputWidth);
        inputWidth = owner.inputWidth;
        if (inputWidth) {
            triggerWrap.setStyle('width', inputWidth + (ieInputWidthAdjustment) + 'px');
        } else {
            triggerWrap.setStyle('width', width + suffix);
        }
        triggerWrap.setStyle('table-layout', 'fixed');
    },

    adjustIEInputPadding: function(ownerContext) {
        // adjust for IE 6/7 strict content-box model
        this.owner.inputCell.setStyle('padding-right', this.ieInputWidthAdjustment + 'px');
    },

    /**
     * @private
     * Returns the width of the "extras" around the input field. This includes the total width
     * of all the triggers in the field and any outer bordering.
     * 
     * This measurement is used when explicitly sizing the contained input field to a smaller inner
     * width while keeping the outer component width the same. This extra width is subtracted from the
     * total component width to calculate the new width for the input field.
     */
    getExtraWidth: function(ownerContext) {
        var me = this,
            owner = me.owner,
            borderWidths = me.borderWidths,
            ui = owner.ui + owner.triggerEl.getCount();

        if (!(ui in borderWidths)) {
            borderWidths[ui] = ownerContext.triggerWrap.getBorderInfo().width
        }
        return borderWidths[ui] + owner.getTriggerWidth();
    },

    beginLayoutShrinkWrap: function (ownerContext) {
        var owner = ownerContext.target,
            emptyString = '',
            inputWidth = owner.inputWidth,
            triggerWrap = owner.triggerWrap;

        this.callParent(arguments);

        if (inputWidth) {
            triggerWrap.setStyle('width', inputWidth + 'px');
            inputWidth = (inputWidth - this.getExtraWidth(ownerContext)) + 'px';
            owner.inputEl.setStyle('width', inputWidth);
            owner.inputCell.setStyle('width', inputWidth);
        } else {
            owner.inputCell.setStyle('width', emptyString);
            owner.inputEl.setStyle('width', emptyString);
            triggerWrap.setStyle('width', emptyString);
            triggerWrap.setStyle('table-layout', 'auto');
        }
    },

    getTextWidth: function () {
        var me = this,
            owner = me.owner,
            inputEl = owner.inputEl,
            value;

        // Find the width that contains the whole text value
        value = (inputEl.dom.value || (owner.hasFocus ? '' : owner.emptyText) || '') + owner.growAppend;
        return inputEl.getTextWidth(value);
    },
    
    publishOwnerWidth: function(ownerContext, width) {
        var owner = this.owner;
        this.callParent(arguments);
        if (!owner.grow && !owner.inputWidth) {
            width -= this.getExtraWidth(ownerContext);
            if (owner.labelAlign != 'top') {
                width -= owner.getLabelWidth();
            }
            ownerContext.inputContext.setWidth(width);
        }    
    },

    publishInnerHeight: function(ownerContext, height) {
        ownerContext.inputContext.setHeight(height - this.measureLabelErrorHeight(ownerContext));
    },

    measureContentWidth: function (ownerContext) {
        var me = this,
            owner = me.owner,
            width = me.callParent(arguments),
            inputContext = ownerContext.inputContext,
            calcWidth, max, min;

        if (owner.grow && !ownerContext.state.growHandled) {
            calcWidth = me.getTextWidth() + ownerContext.inputContext.getFrameInfo().width;

            max = owner.growMax;
            min = Math.min(max, width);
            max = Math.max(owner.growMin, max, min);

            // Constrain
            calcWidth = Ext.Number.constrain(calcWidth, owner.growMin, max);
            inputContext.setWidth(calcWidth);
            ownerContext.state.growHandled = true;
            
            // Now that we've set the inputContext, we need to recalculate the width
            inputContext.domBlock(me, 'width');
            width = NaN;
        } else if (!owner.inputWidth) {
            width -= me.getExtraWidth(ownerContext);
        }
        return width;
    },

    updateEditState: function() {
        var me = this,
            owner = me.owner,
            inputEl = owner.inputEl,
            noeditCls = Ext.baseCSSPrefix + 'trigger-noedit',
            displayed,
            readOnly;

        if (me.owner.readOnly) {
            inputEl.addCls(noeditCls);
            readOnly = true;
            displayed = false;
        } else {
            if (me.owner.editable) {
                inputEl.removeCls(noeditCls);
                readOnly = false;
            } else {
                inputEl.addCls(noeditCls);
                readOnly = true;
            }
            displayed = !me.owner.hideTrigger;
        }

        owner.triggerCell.setDisplayed(displayed);
        inputEl.dom.readOnly = readOnly;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Layout class for {@link Ext.form.field.ComboBox} fields. Handles sizing the input field.
 * @private
 */
Ext.define('Ext.layout.component.field.ComboBox', {
    extend:  Ext.layout.component.field.Trigger ,
    alias: 'layout.combobox',
                                       

    type: 'combobox',

    startingWidth: null,

    getTextWidth: function () {
        var me = this,
            owner = me.owner,
            store = owner.store,
            field = owner.displayField,
            storeLn = store.data.length,
            value = '',
            i = 0, n = 0, ln, item, width;

        for (; i < storeLn; i++) {
            item = store.getAt(i).data[field];
            ln = item.length;
            // compare the current item's length with the current longest length and store the value
            if (ln > n) {
                n = ln;
                value = item;
            }
        }

        width = Math.max(me.callParent(arguments), owner.inputEl.getTextWidth(value + owner.growAppend));

        // it's important to know the starting width else the inputEl could be resized smaller than the boundlist
        // NOTE that when removing items from the store that the startingWidth needs to be recalculated
        if (!me.startingWidth || owner.removingRecords) {
            me.startingWidth = width;

            // also, if the width is less than growMin reset the default boundlist width
            // or it will appear wider than the component if the trigger is clicked
            if (width < owner.growMin) {
                owner.defaultListConfig.minWidth = owner.growMin;
            }

            owner.removingRecords = false;
        }
 
        // only resize if the new width is greater than the starting width
        return (width < me.startingWidth) ? me.startingWidth : width;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This override provides extra, border layout specific methods for `Ext.Component`. The
 * `Ext.layout.container.Border` class requires this override so that the added functions
 * are only included in a build when `border` layout is used.
 */
Ext.define('Ext.layout.container.border.Region', {
    override: 'Ext.Component',

    /**
     * This method is called by the `Ext.layout.container.Border` class when instances are
     * added as regions to the layout. Since it is valid to add any component to a border
     * layout as a region, this method must be added to `Ext.Component` but is only ever
     * called when that component is owned by a `border` layout.
     * @private
     */
    initBorderRegion: function () {
        var me = this;

        if (!me._borderRegionInited) {
            me._borderRegionInited = true;

            // Now that border regions can have dynamic region/weight, these need to be
            // saved to state as they change:
            me.addStateEvents(['changeregion', 'changeweight']);

            // We override getState on the instance for a couple reasons. Firstly, since
            // there are very few border regions in an application, the overhead here is
            // not a concern. Secondly, if this method were on the prototype it would
            // impact all components.
            Ext.override(me, {
                getState: function () {
                    var state = me.callParent();

                    // Now that border regions can have dynamic region/weight, these need to be saved
                    // to state:
                    state = me.addPropertyToState(state, 'region');
                    state = me.addPropertyToState(state, 'weight');

                    return state;
                }
            });
        }
    },

    /**
     * Returns the owning container if that container uses `border` layout. Otherwise
     * this method returns `null`.
     * @return {Ext.container.Container} The owning border container or `null`.
     * @private
     */
    getOwningBorderContainer: function () {
        var layout = this.getOwningBorderLayout();
        return layout && layout.owner;
    },

    /**
     * Returns the owning `border` (`Ext.layout.container.Border`) instance if there is
     * one. Otherwise this method returns `null`.
     * @return {Ext.layout.container.Border} The owning border layout or `null`.
     * @private
     */
    getOwningBorderLayout: function () {
        // the ownerLayot (if set) may or may not be a border layout
        var layout = this.ownerLayout;
        return (layout && layout.isBorderLayout) ? layout : null;
    },

    /**
     * This method changes the `region` config property for this border region. This is
     * only valid if this component is in a `border` layout (`Ext.layout.container.Border`).
     * @param {String} region The new `region` value (`"north"`, `"south"`, `"east"` or
     * `"west"`).
     * @return {String} The previous value of the `region` property.
     */
    setBorderRegion: function (region) {
        var me = this,
            borderLayout,
            old = me.region;

        if (region !== old) {
            borderLayout = me.getOwningBorderLayout();
            if (borderLayout) {
                var regionFlags = borderLayout.regionFlags[region],
                    placeholder = me.placeholder,
                    splitter = me.splitter,
                    owner = borderLayout.owner,
                    regionMeta = borderLayout.regionMeta,
                    collapsed = me.collapsed || me.floated,
                    delta, items, index;

                if (me.fireEventArgs('beforechangeregion', [me, region]) === false) {
                    return old;
                }
                Ext.suspendLayouts();

                me.region = region;
                Ext.apply(me, regionFlags);

                if (me.updateCollapseTool) {
                    me.updateCollapseTool();
                }

                if (splitter) {
                    // splitter.region = region; -- we don't set "region" on splitters!
                    Ext.apply(splitter, regionFlags);
                    splitter.updateOrientation();

                    items = owner.items;
                    index = items.indexOf(me);
                    if (index >= 0) {
                        delta = regionMeta[region].splitterDelta;
                        if (items.getAt(index + delta) !== splitter) {
                            // splitter is not where we expect it, so move it there
                            items.remove(splitter);
                            index = items.indexOf(me);  // could have changed
                            if (delta > 0) {
                                ++index;
                            }
                            // else, insert at index and splitter will be before the item
                            items.insert(index, splitter);

                            // Now that the splitter is in the right place in me.items,
                            // the layout will fix up the DOM childNode to be at the same
                            // index as well.
                        }
                    }
                }
                if (placeholder) {
                    // The collapsed item is potentially remembering wrong things (for
                    // example, if it was collapsed as a West region and changed to be
                    // North). The only simple answer here is to expand/collapse the
                    // item (w/o animation).
                    if (collapsed) {
                        me.expand(false);
                    }

                    owner.remove(placeholder);
                    me.placeholder = null; // force creation of a new placeholder

                    if (collapsed) {
                        me.collapse(null, false);
                    }
                }

                owner.updateLayout();
                Ext.resumeLayouts(true);

                me.fireEventArgs('changeregion', [me, old]);
            } else {
                me.region = region; // maybe not added yet
            }
        }

        return old;
    },

    /**
     * Sets the `weight` config property for this component. This is only valid if this
     * component is in a `border` layout (`Ext.layout.container.Border`).
     * @param {Number} weight The new `weight` value.
     * @return {Number} The previous value of the `weight` property.
     */
    setRegionWeight: function (weight) {
        var me = this,
            ownerCt = me.getOwningBorderContainer(),
            placeholder = me.placeholder,
            old = me.weight;

        if (weight !== old) {
            if (me.fireEventArgs('beforechangeweight', [me, weight]) !== false) {
                me.weight = weight;
                if (placeholder) {
                    placeholder.weight = weight;
                }
                if (ownerCt) {
                    ownerCt.updateLayout();
                }
                me.fireEventArgs('changeweight', [me, old]);
            }
        }

        return old;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class is a base class for an event domain. In the context of MVC, an "event domain"
 * is one or more base classes that fire events to which a Controller wants to listen. A
 * controller listens to events by describing the selectors for events of interest to it.
 *
 * Matching selectors to the firer of an event is one key aspect that defines an event
 * domain. All event domain instances must provide a `match` method that tests selectors
 * against the event firer.
 *
 * When an event domain instance is created (typically as a `singleton`), its `type`
 * property is used to catalog the domain in the
 * {@link Ext.app.EventDomain#instances Ext.app.EventDomain.instances} map.
 *
 * There are five event domains provided by default:
 *
 * -   {@link Ext.app.domain.Component Component domain}. This is the primary event domain that
 * has been available since Ext JS MVC was introduced. This domain is defined as any class that
 * extends {@link Ext.Component}, where the selectors use
 * {@link Ext.ComponentQuery#query Ext.ComponentQuery}.
 * -   {@link Ext.app.domain.Global Global domain}. This domain provides Controllers with access
 * to events fired from {@link Ext#globalEvents} Observable instance. These events represent
 * the state of the application as a whole, and are always anonymous. Because of this, Global
 * domain does not provide selectors at all.
 * -   {@link Ext.app.domain.Controller Controller domain}. This domain includes all classes
 * that extend {@link Ext.app.Controller}. Events fired by Controllers will be available
 * within this domain; selectors are either Controller's {@link Ext.app.Controller#id id} or
 * '*' wildcard for any Controller.
 * -   {@link Ext.app.domain.Store Store domain}. This domain is for classes extending
 * {@link Ext.data.AbstractStore}. Selectors are either Store's
 * {@link Ext.data.AbstractStore#storeId storeId} or '*' wildcard for any Store.
 * -   {@link Ext.app.domain.Direct Direct domain}. This domain includes all classes that extend
 * {@link Ext.direct.Provider}. Selectors are either Provider's {@link Ext.direct.Provider#id id}
 * or '*' wildcard for any Provider. This domain is optional and will be loaded only if
 * {@link Ext.direct.Manager} singleton is required in your application.
 *
 * @protected
 */

Ext.define('Ext.app.EventDomain', {
               
                        
      

    statics: {
        /**
         * An object map containing `Ext.app.EventDomain` instances keyed by the value
         * of their `type` property.
         */
        instances: {}
    },
    
    /**
     * @cfg {String} idProperty Name of the identifier property for this event domain.
     */
     
    isEventDomain: true,

    constructor: function() {
        var me = this;

        Ext.app.EventDomain.instances[me.type] = me;

        me.bus = {};
        me.monitoredClasses = [];
    },

    /**
     * This method dispatches an event fired by an object monitored by this domain. This
     * is not called directly but is called by interceptors injected by the `monitor` method.
     * 
     * @param {Object} target The firer of the event.
     * @param {String} ev The event being fired.
     * @param {Array} args The arguments for the event. This array **does not** include the event name.
     * That has already been sliced off because this class intercepts the {@link Ext.util.Observable#fireEventArgs fireEventArgs}
     * method which takes an array as the event's argument list.
     *
     * @return {Boolean} `false` if any listener returned `false`, otherwise `true`.
     *
     * @private
     */
    dispatch: function(target, ev, args) {
        var me = this,
            bus = me.bus,
            selectors = bus[ev],
            selector, controllers, id, events, event, i, ln;

        if (!selectors) {
            return true;
        }

        // Loop over all the selectors that are bound to this event
        for (selector in selectors) {
            // Check if the target matches the selector
            if (selectors.hasOwnProperty(selector) && me.match(target, selector)) {
                // Loop over all the controllers that are bound to this selector
                controllers = selectors[selector];

                for (id in controllers) {
                    if (controllers.hasOwnProperty(id)) {
                        // Loop over all the events that are bound to this selector
                        events = controllers[id];

                        for (i = 0, ln = events.length; i < ln; i++) {
                            event = events[i];

                            // Fire the event!
                            if (event.fire.apply(event, args) === false) {
                                return false;
                            }
                        }
                    }
                }
            }
        }

        return true;
    },

    /**
     * This method adds listeners on behalf of a controller. This method is passed an
     * object that is keyed by selectors. The value of these is also an object but now
     * keyed by event name. For example:
     * 
     *      domain.listen({
     *          'some[selector]': {
     *              click: function() { ... }
     *          },
     *          
     *          'other selector': {
     *              change: {
     *                  fn: function() { ... },
     *                  delay: 10
     *              }
     *          }
     *      
     *      }, controller);
     * 
     * @param {Object} selectors Config object containing selectors and listeners.
     *
     * @private
     */
    listen: function(selectors, controller) {
        var me = this,
            bus = me.bus,
            idProperty = me.idProperty,
            monitoredClasses = me.monitoredClasses,
            monitoredClassesCount = monitoredClasses.length,
            i, tree, list, selector, options, listener, scope, event, listeners, ev;

        for (selector in selectors) {
            if (selectors.hasOwnProperty(selector) && (listeners = selectors[selector])) {
                if (idProperty) {
                
                    selector = selector === '*' ? selector : selector.substring(1);
                }
                
                for (ev in listeners) {
                    if (listeners.hasOwnProperty(ev)) {
                        options  = null;
                        listener = listeners[ev];
                        scope    = controller;
                        event    = new Ext.util.Event(controller, ev);

                        // Normalize the listener
                        if (Ext.isObject(listener)) {
                            options  = listener;
                            listener = options.fn;
                            scope    = options.scope || controller;

                            delete options.fn;
                            delete options.scope;
                        }

                        if (typeof listener === 'string') {
                            listener = scope[listener];
                        }
                        event.addListener(listener, scope, options);

                        for (i = monitoredClassesCount; i-- > 0;) {
                            monitoredClasses[i].hasListeners._incr_(ev);
                        }

                        // Create the bus tree if it is not there yet
                        tree = bus[ev]             || (bus[ev] = {});
                        tree = tree[selector]      || (tree[selector] = {});
                        list = tree[controller.id] || (tree[controller.id] = []);

                        // Push our listener in our bus
                        list.push(event);
                    }
                } //end inner loop
            }
        } //end outer loop
    },

    /**
     * This method matches the firer of the event (the `target`) to the given `selector`.
     * Default matching is very simple: a match is true when selector equals target's
     * {@link #cfg-idProperty idProperty}, or when selector is '*' wildcard to match any
     * target.
     * 
     * @param {Object} target The firer of the event.
     * @param {String} selector The selector to which to match the `target`.
     *
     * @return {Boolean} `true` if the `target` matches the `selector`.
     *
     * @protected
     */
    match: function(target, selector) {
        var idProperty = this.idProperty;
        
        if (idProperty) {
            return selector === '*' || target[idProperty] === selector;
        }
        
        return false;
    },

    /**
     * This method is called by the derived class to monitor `fireEvent` calls. Any call
     * to `fireEvent` on the target Observable will be intercepted and dispatched to any
     * listening Controllers. Assuming the original `fireEvent` method does not return
     * `false`, the event is passed to the `dispatch` method of this object.
     * 
     * This is typically called in the `constructor` of derived classes.
     * 
     * @param {Ext.Class} observable The Observable to monitor for events.
     *
     * @protected
     */
    monitor: function(observable) {
        var domain = this,
            prototype = observable.isInstance ? observable : observable.prototype,
            fireEventArgs = prototype.fireEventArgs;

        domain.monitoredClasses.push(observable);

        prototype.fireEventArgs = function(ev, args) {
            var ret = fireEventArgs.apply(this, arguments);

            if (ret !== false) {
                ret = domain.dispatch(this, ev, args);
            }

            return ret;
        };
    },

    /**
     * Removes all of a controller's attached listeners.
     *
     * @param {String} controllerId The id of the controller.
     *
     * @private
     */
    unlisten: function(controllerId) {
        var bus = this.bus,
            controllers, ev, selector, selectors;

        for (ev in bus) {
            if (bus.hasOwnProperty(ev) && (selectors = bus[ev])) {
                for (selector in selectors) {
                    controllers = selectors[selector];
                    delete controllers[controllerId];  // harmless if !hasOwnProperty
                }
            }
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class implements the component event domain. All classes extending from
 * {@link Ext.Component} are included in this domain. The matching criteria uses
 * {@link Ext.ComponentQuery}.
 * 
 * @protected
 */
Ext.define('Ext.app.domain.Component', {
    extend:  Ext.app.EventDomain ,
    singleton: true,

               
                       
      

    type: 'component',

    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.Component);
    },

    match: function(target, selector) {
        return target.is(selector);
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class manages event dispatching for Controllers. The details of connecting classes
 * to this dispatching mechanism is delegated to {@link Ext.app.EventDomain} instances.
 *
 * @private
 */
Ext.define('Ext.app.EventBus', {
    singleton: true,

               
                                  
      
    
    constructor: function() {
        var me = this,
            domains = Ext.app.EventDomain.instances;

        me.callParent();

        me.domains = domains;
        me.bus = domains.component.bus; // compat
    },

    /**
     * Adds a set of component event listeners for a controller. To work with event domains
     * other than component, see {@link #listen}.
     *
     * @param {Object} selectors Config object containing selectors and listeners.
     * @param {Ext.app.Controller} controller The listening controller instance.
     */
    control: function(selectors, controller) {
        return this.domains.component.listen(selectors, controller);
    },

    /**
     * Adds a set of event domain listeners for a controller. For more information on event
     * domains, see {@link Ext.app.EventDomain} and {@link Ext.app.Controller}.
     *
     * @param {Object} to Config object containing domains, selectors and listeners.
     * @param {Ext.app.Controller} controller The listening controller instance.
     */
    listen: function(to, controller) {
        var domains = this.domains,
            domain;

        for (domain in to) {
            if (to.hasOwnProperty(domain)) {
                domains[domain].listen(to[domain], controller);
            }
        }
    },

    /**
     * Removes all of a controller's attached listeners.
     *
     * @param {String} controllerId The id of the controller.
     */
    unlisten: function(controllerId) {
        var domains = Ext.app.EventDomain.instances,
            domain;
        
        for (domain in domains) {
            domains[domain].unlisten(controllerId);
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class implements the global event domain. This domain represents event fired from
 * {@link Ext#globalEvents} Observable instance. No selectors are supported for this domain.
 * 
 * @protected
 */
Ext.define('Ext.app.domain.Global', {
    extend:  Ext.app.EventDomain ,
    singleton: true,

    type: 'global',

    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.globalEvents);
    },
    
    /**
     * This method adds listeners on behalf of a controller. Since Global domain does not
     * support selectors, we skip this layer and just accept an object keyed by events.
     * For example:
     *
     *      domain.listen({
     *          idle: function() { ... },
     *          afterlayout: {
     *              fn: function() { ... },
     *              delay: 10
     *          }
     *      });
     *
     * @param {Object} listeners Config object containing listeners.
     *
     * @private
     */              
    listen: function(listeners, controller) {
        // Parent method requires selectors so we just wrap passed listeners
        // in a dummy selector
        this.callParent([{ global: listeners }, controller]);
    },

    match: function() {
        return true;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class implements the data store event domain. All classes extending from 
 * {@link Ext.data.AbstractStore} are included in this domain. The selectors are simply
 * store id's or the wildcard "*" to match any store.
 *
 * @protected
 */

Ext.define('Ext.app.domain.Store', {
    extend:  Ext.app.EventDomain ,
    singleton: true,
    
               
                                
      
    
    type: 'store',
    idProperty: 'storeId',
    
    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.data.AbstractStore);
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Controllers are the glue that binds an application together. All they really do is listen for events (usually from
 * views) and take some action. Here's how we might create a Controller to manage Users:
 *
 *      Ext.define('MyApp.controller.Users', {
 *          extend: 'Ext.app.Controller',
 *
 *          init: function() {
 *              console.log('Initialized Users! This happens before ' +
 *                          'the Application launch() function is called');
 *          }
 *      });
 *
 * The init function is a special method that is called when your application boots. It is called before the
 * {@link Ext.app.Application Application}'s launch function is executed so gives a hook point to run any code before
 * your Viewport is created.
 *
 * The init function is a great place to set up how your controller interacts with the view, and is usually used in
 * conjunction with another Controller function - {@link Ext.app.Controller#control control}. The control function
 * makes it easy to listen to events on your view classes and take some action with a handler function. Let's update
 * our Users controller to tell us when the panel is rendered:
 *
 *      Ext.define('MyApp.controller.Users', {
 *          extend: 'Ext.app.Controller',
 *
 *          init: function() {
 *              this.control({
 *                  'viewport > panel': {
 *                      render: this.onPanelRendered
 *                  }
 *              });
 *          },
 *
 *          onPanelRendered: function() {
 *              console.log('The panel was rendered');
 *          }
 *      });
 *
 * We've updated the init function to use {@link Ext.app.Controller#control control method} to set up listeners on views
 * in our application. The control method uses the ComponentQuery engine to quickly and easily get references to components
 * on the page. If you are not familiar with ComponentQuery yet, be sure to check out the
 * {@link Ext.ComponentQuery documentation}. In brief though, it allows us to pass a CSS-like selector that will find
 * every matching component on the page.
 *
 * In our init function above we supplied 'viewport > panel', which translates to "find me every Panel that is a direct
 * child of a Viewport". We then supplied an object that maps event names (just 'render' in this case) to handler
 * functions. The overall effect is that whenever any component that matches our selector fires a 'render' event, our
 * onPanelRendered function is called.
 *
 * ## Event domains
 *
 * In Ext JS 4.2, we introduced the concept of event domains. In terms of MVC, an event domain
 * is one or more base classes that fire events to which a Controller wants to listen. Besides
 * Component event domain that encompass {@link Ext.Component}-descended Views, Controllers now
 * can listen to events from data Stores, Ext.Direct Providers, other Controllers, and Ext.globalEvents.
 * This feature provides a way to communicate between parts of the whole application without the need
 * to bind controllers together tightly, and allows to develop and test application parts in isolation.
 *
 * See usage examples in {@link #listen} method documentation.
 *
 * ## Using refs
 *
 * One of the most useful parts of Controllers is the ref system. These use the {@link Ext.ComponentQuery} to
 * make it really easy to get references to Views on your page. Let's look at an example of this now:
 *
 *      Ext.define('MyApp.controller.Users', {
 *          extend: 'Ext.app.Controller',
 *          
 *          refs: [{
 *              ref: 'list',
 *              selector: 'grid'
 *          }],
 *          
 *          init: function() {
 *              this.control({
 *                  'button': {
 *                      click: this.refreshGrid
 *                  }
 *              });
 *          },
 *          
 *          refreshGrid: function() {
 *              this.getList().store.load();
 *          }
 *      });
 *
 * This example assumes the existence of a {@link Ext.grid.Panel Grid} on the page, which contains a single button to
 * refresh the Grid when clicked. In our refs array, we set up a reference to the grid. There are two parts to this -
 * the 'selector', which is a {@link Ext.ComponentQuery ComponentQuery} selector which finds any grid on the page and
 * assigns it to the reference 'list'.
 *
 * By giving the reference a name, we get a number of things for free. The first is the getList function that we use in
 * the refreshGrid method above. This is generated automatically by the Controller based on the name of our ref, which
 * was capitalized and prepended with get to go from 'list' to 'getList'.
 *
 * The way this works is that the first time getList is called by your code, the ComponentQuery selector is run and the
 * first component that matches the selector ('grid' in this case) will be returned. All future calls to getList will
 * use a cached reference to that grid. Usually it is advised to use a specific ComponentQuery selector that will only
 * match a single View in your application (in the case above our selector will match any grid on the page).
 *
 * Bringing it all together, our init function is called when the application boots, at which time we call this.control
 * to listen to any click on a {@link Ext.button.Button button} and call our refreshGrid function (again, this will
 * match any button on the page so we advise a more specific selector than just 'button', but have left it this way for
 * simplicity). When the button is clicked we use out getList function to refresh the grid.
 *
 * You can create any number of refs and control any number of components this way, simply adding more functions to
 * your Controller as you go. For an example of real-world usage of Controllers see the Feed Viewer example in the
 * examples/app/feed-viewer folder in the SDK download.
 *
 * ## Generated getter methods
 *
 * Refs aren't the only thing that generate convenient getter methods. Controllers often have to deal with Models and
 * Stores so the framework offers a couple of easy ways to get access to those too. Let's look at another example:
 *
 *      Ext.define('MyApp.controller.Users', {
 *          extend: 'Ext.app.Controller',
 *
 *          models: ['User'],
 *          stores: ['AllUsers', 'AdminUsers'],
 *
 *          init: function() {
 *              var User, allUsers, ed;
 *              
 *              User = this.getUserModel();
 *              allUsers = this.getAllUsersStore();
 *
 *              ed = new User({ name: 'Ed' });
 *              allUsers.add(ed);
 *          }
 *      });
 *
 * By specifying Models and Stores that the Controller cares about, it again dynamically loads them from the appropriate
 * locations (app/model/User.js, app/store/AllUsers.js and app/store/AdminUsers.js in this case) and creates getter
 * functions for them all. The example above will create a new User model instance and add it to the AllUsers Store.
 * Of course, you could do anything in this function but in this case we just did something simple to demonstrate the
 * functionality.
 *
 * ## Further Reading
 *
 * For more information about writing Ext JS 4 applications, please see the
 * [application architecture guide](#/guide/application_architecture). Also see the {@link Ext.app.Application}
 * documentation.
 *
 * @docauthor Ed Spencer
 */
Ext.define('Ext.app.Controller', {
               
                           
                           
                                
                               
                                
                                   
                              
      
    
           
                                   
      

    mixins: {
        observable:  Ext.util.Observable 
    },

    /**
     * @cfg {String} id The id of this controller. You can use this id when dispatching.
     */

    statics: {
        strings: {
            model: {
                getter: 'getModel',
                upper: 'Model'
            },

            view: {
                getter: 'getView',
                upper: 'View'
            },

            controller: {
                getter: 'getController',
                upper: 'Controller'
            },

            store: {
                getter: 'getStore',
                upper: 'Store'
            }
        },

        controllerRegex: /^(.*)\.controller\./,

        createGetter: function(baseGetter, name) {
            return function () {
                return this[baseGetter](name);
            };
        },

        getGetterName: function(name, kindUpper) {
            var fn       = 'get',
                parts    = name.split('.'),
                numParts = parts.length,
                index;

            // Handle namespaced class names. E.g. feed.Add becomes getFeedAddView etc.
            for (index = 0; index < numParts; index++) {
                fn += Ext.String.capitalize(parts[index]);
            }

            fn += kindUpper;
            
            return fn;
        },

        /**
         * This method is called like so:
         *
         *      Ext.app.Controller.processDependencies(proto, requiresArray, 'MyApp', 'model', [
         *          'User',
         *          'Item',
         *          'Foo@Common.model',
         *          'Bar.Baz@Common.model'
         *      ]);
         *
         * Required dependencies are added to requiresArray.
         *
         * @private
         */
        processDependencies: function(cls, requires, namespace, kind, names) {
            if (!names || !names.length) {
                return;
            }

            var me = this,
                strings = me.strings[kind],
                o, absoluteName, shortName, name, j, subLn, getterName, getter;
                
             if (!Ext.isArray(names)) {
                 names = [names];
             }

            for (j = 0, subLn = names.length; j < subLn; j++) {
                name = names[j];
                o = me.getFullName(name, kind, namespace);
                absoluteName = o.absoluteName;
                shortName = o.shortName;

                requires.push(absoluteName);
                getterName = me.getGetterName(shortName, strings.upper);
                cls[getterName] = getter = me.createGetter(strings.getter, name);

                // Application class will init the controller getters
                if (kind !== 'controller') {
                    // This marker allows the constructor to easily/cheaply identify the
                    // generated getter methods since they all need to be called to get
                    // things initialized. We use a property name that deliberately does
                    // not work with dot-access to reduce any chance of collision.
                    getter['Ext.app.getter'] = true;
                }
            }
        },

        getFullName: function(name, kind, namespace) {
            var shortName = name,
                sep, absoluteName;

            if ((sep = name.indexOf('@')) > 0) {
                // The unambiguous syntax is Model@Name.space (or "space.Model@Name")
                // which contains both the short name ("Model" or "space.Model") and
                // the full name (Name.space.Model).
                //
                shortName    = name.substring(0, sep); // "Model"
                absoluteName = name.substring(sep + 1) + '.' + shortName; //  ex: "Name.space.Model"
            }
            // Deciding if a class name must be qualified:
            //
            // 1 - if the name doesn't contain a dot, we must qualify it
            //
            // 2 - the name may be a qualified name of a known class, but:
            //
            // 2.1 - in runtime, the loader may not know the class - specially in
            //       production - so we must check the class manager
            //
            // 2.2 - in build time, the class manager may not know the class, but
            //       the loader does, so we check the second one (the loader check
            //       assures it's really a class, and not a namespace, so we can
            //       have 'Books.controller.Books', and requesting a controller
            //       called Books will not be underqualified)
            //
            else if (name.indexOf('.') > 0 && (Ext.ClassManager.isCreated(name) ||
                     Ext.Loader.isAClassNameWithAKnownPrefix(name))) {
                absoluteName = name;
            }
            else {

                if (namespace) {
                    absoluteName = namespace + '.' + kind + '.' + name;
                    shortName    = name;
                }
                else {
                    absoluteName = name;
                }
            }

            return {
                absoluteName: absoluteName,
                shortName:    shortName
            };
        }
    },
    
    /**
     * The {@link Ext.app.Application} for this controller.
     *
     * @property {Ext.app.Application}
     * @readonly
     */
    application: null,

    /**
     * @cfg {String/String[]} models
     * Array of models to require from AppName.model namespace. For example:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          models: ['User', 'Vehicle']
     *      });
     *
     * This is equivalent of:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          requires: ['MyApp.model.User', 'MyApp.model.Vehicle'],
     *          
     *          getUserModel: function() {
     *              return this.getModel("User");
     *          },
     *          
     *          getVehicleModel: function() {
     *              return this.getModel("Vehicle");
     *          }
     *      });
     *
     */

    /**
     * @cfg {String/String[]} views
     * Array of views to require from AppName.view namespace and to generate getter methods for.
     * For example:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          views: ['List', 'Detail']
     *      });
     *
     * This is equivalent of:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          requires: ['MyApp.view.List', 'MyApp.view.Detail'],
     *          
     *          getListView: function() {
     *              return this.getView("List");
     *          },
     *          
     *          getDetailView: function() {
     *              return this.getView("Detail");
     *          }
     *      });
     */

    /**
     * @cfg {String/String[]} stores
     * Array of stores to require from AppName.store namespace and to generate getter methods for.
     * For example:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          stores: ['Users', 'Vehicles']
     *      });
     *
     * This is equivalent to:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *         
     *          requires: [
     *              'MyApp.store.Users',
     *              'MyApp.store.Vehicles'
     *          ]
     *         
     *          getUsersStore: function() {
     *              return this.getStore("Users");
     *          },
     *
     *          getVehiclesStore: function() {
     *              return this.getStore("Vehicles");
     *          }
     *      });
     */

    /**
     * @cfg {Object[]} refs
     * Array of configs to build up references to views on page. For example:
     *
     *      Ext.define("MyApp.controller.Foo", {
     *          extend: "Ext.app.Controller",
     *          
     *          refs: [{
     *              ref: 'list',
     *              selector: 'grid'
     *          }],
     *      });
     *
     * This will add method `getList` to the controller which will internally use
     * Ext.ComponentQuery to reference the grid component on page.
     *
     * The following fields can be used in ref definition:
     *
     * - `ref` - name of the reference.
     * - `selector` - Ext.ComponentQuery selector to access the component.
     * - `autoCreate` - True to create the component automatically if not found on page.
     * - `forceCreate` - Forces the creation of the component every time reference is accessed
     *   (when `get<REFNAME>` is called).
     * - `xtype` - Used to create component by its xtype with autoCreate or forceCreate. If
     *   you don't provide xtype, an Ext.Component instance will be created.
     */

    onClassExtended: function(cls, data, hooks) {
        var onBeforeClassCreated = hooks.onBeforeCreated;

        hooks.onBeforeCreated = function(cls, data) {
            var Controller = Ext.app.Controller,
                ctrlRegex  = Controller.controllerRegex,
                requires   = [],
                className, namespace, requires, proto, match;

            proto = cls.prototype;
            
            /*
             * Namespace resolution is tricky business: we should know what namespace
             * this Controller descendant belongs to, or model/store/view dependency
             * resolution will be either ambiguous or plainly not possible. To avoid
             * guessing games we try to look for a forward hint ($namespace) that
             * Application class sets when its onClassExtended gets processed; if that
             * fails we try to deduce namespace from class name.
             *
             * Note that for Ext.app.Application, Controller.onClassExtended gets executed
             * *before* Application.onClassExtended so we have to delay namespace handling
             * until after Application.onClassExtended kicks in, hence it is done in this hook.
             */
            className = Ext.getClassName(cls);
            namespace = data.$namespace                 ||
                        Ext.app.getNamespace(className) ||
                        ((match = ctrlRegex.exec(className)) && match[1]);

            if (namespace) {
                proto.$namespace = namespace;
            }

            Controller.processDependencies(proto, requires, namespace, 'model',      data.models);
            Controller.processDependencies(proto, requires, namespace, 'view',       data.views);
            Controller.processDependencies(proto, requires, namespace, 'store',      data.stores);
            Controller.processDependencies(proto, requires, namespace, 'controller', data.controllers);

            Ext.require(requires, Ext.Function.pass(onBeforeClassCreated, arguments, this));
        };
    },

    /**
     * Creates new Controller.
     *
     * @param {Object} [config] Configuration object.
     */
    constructor: function (config) {
        var me = this;

        me.mixins.observable.constructor.call(me, config);

        if (me.refs) {
            me.ref(me.refs);
        }

        me.eventbus = Ext.app.EventBus;
        
        me.initAutoGetters();
    },
    
    initAutoGetters: function() {
        var proto = this.self.prototype,
            prop, fn;

        for (prop in proto) {
            fn = proto[prop];

            // Look for the marker placed on the getters by processDependencies so that
            // we can know what to call cheaply:
            if (fn && fn['Ext.app.getter']) {
                fn.call(this);
            }
        }
    },

    doInit: function(app) {
        var me = this;

        if (!me._initialized) {
            me.init(app);
            me._initialized = true;
        }
    },
    
    finishInit: function(app) {
        var me = this,
            controllers = me.controllers,
            controller, i, l;
        
        if (me._initialized && controllers && controllers.length) {
            for (i = 0, l = controllers.length; i < l; i++) {
                controller = me.getController(controllers[i]);
                controller.finishInit(app);
            }
        }
    },

    /**
     * A template method that is called when your application boots. It is called before the
     * {@link Ext.app.Application Application}'s launch function is executed so gives a hook point
     * to run any code before your Viewport is created.
     *
     * @param {Ext.app.Application} application
     *
     * @template
     */
    init: Ext.emptyFn,

    /**
     * A template method like {@link #init}, but called after the viewport is created.
     * This is called after the {@link Ext.app.Application#launch launch} method of Application
     * is executed.
     *
     * @param {Ext.app.Application} application
     *
     * @template
     */
    onLaunch: Ext.emptyFn,

    ref: function(refs) {
        var me = this,
            i = 0,
            length = refs.length,
            info, ref, fn;

        refs = Ext.Array.from(refs);

        me.references = me.references || [];

        for (; i < length; i++) {
            info = refs[i];
            ref  = info.ref;
            fn   = 'get' + Ext.String.capitalize(ref);

            if (!me[fn]) {
                me[fn] = Ext.Function.pass(me.getRef, [ref, info], me);
            }
            me.references.push(ref.toLowerCase());
        }
    },

    /**
     * Registers one or more {@link #refs references}.
     *
     * @param {Object/Object[]} refs
     */
    addRef: function(refs) {
        this.ref(refs);
    },

    getRef: function(ref, info, config) {
        var me = this,
            refCache = me.refCache || (me.refCache = {}),
            cached = refCache[ref];

        info = info || {};
        config = config || {};

        Ext.apply(info, config);

        if (info.forceCreate) {
            return Ext.ComponentManager.create(info, 'component');
        }

        if (!cached) {
            if (info.selector) {
                refCache[ref] = cached = Ext.ComponentQuery.query(info.selector)[0];
            }
            
            if (!cached && info.autoCreate) {
                refCache[ref] = cached = Ext.ComponentManager.create(info, 'component');
            }
            
            if (cached) {
                cached.on('beforedestroy', function() {
                    refCache[ref] = null;
                });
            }
        }

        return cached;
    },

    /**
     * Returns `true` if a {@link #refs reference} is registered.
     *
     * @return {Boolean}
     */
    hasRef: function(ref) {
        var references = this.references;
        return references && Ext.Array.indexOf(references, ref.toLowerCase()) !== -1;
    },

    /**
     * Adds listeners to components selected via {@link Ext.ComponentQuery}. Accepts an
     * object containing component paths mapped to a hash of listener functions.
     *
     * In the following example the `updateUser` function is mapped to to the `click`
     * event on a button component, which is a child of the `useredit` component.
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.control({
     *                  'useredit button[action=save]': {
     *                      click: this.updateUser
     *                  }
     *              });
     *          },
     *          
     *          updateUser: function(button) {
     *              console.log('clicked the Save button');
     *          }
     *      });
     *
     * Or alternatively one call `control` with two arguments:
     *
     *      this.control('useredit button[action=save]', {
     *          click: this.updateUser
     *      });
     *
     * See {@link Ext.ComponentQuery} for more information on component selectors.
     *
     * @param {String/Object} selectors If a String, the second argument is used as the
     * listeners, otherwise an object of selectors -> listeners is assumed
     * @param {Object} [listeners] Config for listeners.
     */
    control: function(selectors, listeners, controller) {
        var me = this,
            ctrl = controller,
            obj;

        if (Ext.isString(selectors)) {
            obj = {};
            obj[selectors] = listeners;
        }
        else {
            obj = selectors;
            ctrl = listeners;
        }

        me.eventbus.control(obj, ctrl || me);
    },

    /**
     * Adds listeners to different event sources (also called "event domains"). The
     * primary event domain is that of components, but there are also other event domains:
     * {@link Ext.app.domain.Global Global} domain that intercepts events fired from
     * {@link Ext#globalEvents} Observable instance, {@link Ext.app.domain.Controller Controller}
     * domain can be used to listen to events fired by other Controllers,
     * {@link Ext.app.domain.Store Store} domain gives access to Store events, and
     * {@link Ext.app.domain.Direct Direct} domain can be used with Ext.Direct Providers
     * to listen to their events.
     * 
     * To listen to "bar" events fired by a controller with id="foo":
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.listen({
     *                  controller: {
     *                      '#foo': {
     *                         bar: this.onFooBar
     *                      }
     *                  }
     *              });
     *          },
     *          ...
     *      });
     * 
     * To listen to "bar" events fired by any controller, and "baz" events
     * fired by Store with storeId="baz":
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.listen({
     *                  controller: {
     *                      '*': {
     *                         bar: this.onAnyControllerBar
     *                      }
     *                  },
     *                  store: {
     *                      '#baz': {
     *                          baz: this.onStoreBaz
     *                      }
     *                  }
     *              });
     *          },
     *          ...
     *      });
     *
     * To listen to "idle" events fired by {@link Ext#globalEvents} when other event
     * processing is complete and Ext JS is about to return control to the browser:
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.listen({
     *                  global: {               // Global events are always fired
     *                      idle: this.onIdle   // from the same object, so there
     *                  }                       // are no selectors
     *              });
     *          }
     *      });
     * 
     * As this relates to components, the following example:
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.listen({
     *                  component: {
     *                      'useredit button[action=save]': {
     *                         click: this.updateUser
     *                      }
     *                  }
     *              });
     *          },
     *          ...
     *      });
     * 
     * Is equivalent to:
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.control({
     *                  'useredit button[action=save]': {
     *                     click: this.updateUser
     *                  }
     *              });
     *          },
     *          ...
     *      });
     *
     * Of course, these can all be combined in a single call and used instead of
     * `control`, like so:
     *
     *      Ext.define('AM.controller.Users', {
     *          init: function() {
     *              this.listen({
     *                  global: {
     *                      idle: this.onIdle
     *                  },
     *                  controller: {
     *                      '*': {
     *                         foobar: this.onAnyFooBar
     *                      },
     *                      '#foo': {
     *                         bar: this.onFooBar
     *                      }
     *                  },
     *                  component: {
     *                      'useredit button[action=save]': {
     *                         click: this.updateUser
     *                      }
     *                  },
     *                  store: {
     *                      '#qux': {
     *                          load: this.onQuxLoad
     *                      }
     *                  }
     *              });
     *          },
     *          ...
     *      });
     *
     * @param {Object} to Config object containing domains, selectors and listeners.
     */
    listen: function (to, controller) {
        this.eventbus.listen(to, controller || this);
    },

    /**
     * Returns instance of a {@link Ext.app.Controller Controller} with the given id.
     * When controller doesn't exist yet, it's created. Note that this method depends
     * on Application instance and will return undefined when Application is not
     * accessible. The only exception is when this Controller instance's id is requested;
     * in that case we always return the instance even if Application is no available.
     *
     * @param {String} id
     *
     * @return {Ext.app.Controller} controller instance or undefined.
     */
    getController: function(id) {
        var me = this,
            app = me.application;

        if (id === me.id) {
            return me;
        }

        return app && app.getController(id);
    },

    /**
     * Returns instance of a {@link Ext.data.Store Store} with the given name.
     * When store doesn't exist yet, it's created.
     *
     * @param {String} name
     *
     * @return {Ext.data.Store} a store instance.
     */
    getStore: function(name) {
        var storeId, store;

        storeId = (name.indexOf('@') == -1) ? name : name.split('@')[0];
        store   = Ext.StoreManager.get(storeId);

        if (!store) {
            name = Ext.app.Controller.getFullName(name, 'store', this.$namespace);

            if (name) {
                store = Ext.create(name.absoluteName, {
                    storeId: storeId
                });
            }
        }

        return store;
    },

    /**
     * Returns a {@link Ext.data.Model Model} class with the given name.
     * A shorthand for using {@link Ext.ModelManager#getModel}.
     *
     * @param {String} name
     *
     * @return {Ext.data.Model} a model class.
     */
    getModel: function(model) {
        var name = Ext.app.Controller.getFullName(model, 'model', this.$namespace);

        return name && Ext.ModelManager.getModel(name.absoluteName);
    },

    /**
     * Returns a View class with the given name.  To create an instance of the view,
     * you can use it like it's used by Application to create the Viewport:
     *
     *     this.getView('Viewport').create();
     *
     * @param {String} name
     *
     * @return {Ext.Base} a view class.
     */
    getView: function(view) {
        var name = Ext.app.Controller.getFullName(view, 'view', this.$namespace);

        return name && Ext.ClassManager.get(name.absoluteName);
    },

    /**
     * Returns the base {@link Ext.app.Application} for this controller.
     *
     * @return {Ext.app.Application} the application
     */
    getApplication: function() {
        return this.application;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Represents an Ext JS 4 application, which is typically a single page app using a {@link Ext.container.Viewport Viewport}.
 * A typical Ext.app.Application might look like this:
 *
 *     Ext.application({
 *         name: 'MyApp',
 *         launch: function() {
 *             Ext.create('Ext.container.Viewport', {
 *                 items: {
 *                     html: 'My App'
 *                 }
 *             });
 *         }
 *     });
 *
 * This does several things. First it creates a global variable called 'MyApp' - all of your Application's classes (such
 * as its Models, Views and Controllers) will reside under this single namespace, which drastically lowers the chances
 * of colliding global variables. The MyApp global will also have a getApplication method to get a reference to
 * the current application:
 *
 *     var app = MyApp.getApplication();
 *
 * When the page is ready and all of your JavaScript has loaded, your Application's {@link #launch} function is called,
 * at which time you can run the code that starts your app. Usually this consists of creating a Viewport, as we do in
 * the example above.
 *
 * # Telling Application about the rest of the app
 *
 * Because an Ext.app.Application represents an entire app, we should tell it about the other parts of the app - namely
 * the Models, Views and Controllers that are bundled with the application. Let's say we have a blog management app; we
 * might have Models and Controllers for Posts and Comments, and Views for listing, adding and editing Posts and Comments.
 * Here's how we'd tell our Application about all these things:
 *
 *     Ext.application({
 *         name: 'Blog',
 *         models: ['Post', 'Comment'],
 *         controllers: ['Posts', 'Comments'],
 *
 *         launch: function() {
 *             ...
 *         }
 *     });
 *
 * Note that we didn't actually list the Views directly in the Application itself. This is because Views are managed by
 * Controllers, so it makes sense to keep those dependencies there. The Application will load each of the specified
 * Controllers using the pathing conventions laid out in the [application architecture guide][mvc] - in this case
 * expecting the controllers to reside in app/controller/Posts.js and app/controller/Comments.js. In turn, each
 * Controller simply needs to list the Views it uses and they will be automatically loaded. Here's how our Posts
 * controller like be defined:
 *
 *     Ext.define('MyApp.controller.Posts', {
 *         extend: 'Ext.app.Controller',
 *         views: ['posts.List', 'posts.Edit'],
 *
 *         //the rest of the Controller here
 *     });
 *
 * Because we told our Application about our Models and Controllers, and our Controllers about their Views, Ext JS will
 * automatically load all of our app files for us. This means we don't have to manually add script tags into our html
 * files whenever we add a new class, but more importantly it enables us to create a minimized build of our entire
 * application using Sencha Cmd.
 *
 * # Deriving from Ext.app.Application
 *
 * Typically, applications do not derive directly from Ext.app.Application. Rather, the
 * configuration passed to `Ext.application` mimics what you might do in a derived class.
 * In some cases, however, it can be desirable to share logic by using a derived class
 * from `Ext.app.Application`.
 *
 * Derivation works as you would expect, but using the derived class should still be the
 * job of the `Ext.application` method.
 *
 *     Ext.define('MyApp.app.Application', {
 *         extend: 'Ext.app.Application',
 *         name: 'MyApp',
 *         ...
 *     });
 *
 *     Ext.application('MyApp.app.Application');
 *
 * For more information about writing Ext JS 4 applications, please see the [application architecture guide][mvc].
 *
 * [mvc]: #/guide/application_architecture
 *
 * @docauthor Ed Spencer
 */
Ext.define('Ext.app.Application', {
    extend:  Ext.app.Controller ,

               
                                 
      

    /**
     * @cfg {String} name
     * The name of your application. This will also be the namespace for your views, controllers
     * models and stores. Don't use spaces or special characters in the name. **Application name
     * is mandatory**.
     */

    /**
     * @cfg {String/String[]} controllers
     * Names of controllers that the app uses.
     */

    /**
     * @cfg {Object} scope
     * The scope to execute the {@link #launch} function in. Defaults to the Application instance.
     */
    scope: undefined,

    /**
     * @cfg {Boolean} enableQuickTips
     * True to automatically set up Ext.tip.QuickTip support.
     */
    enableQuickTips: true,

    /**
     * @cfg {String} appFolder
     * The path to the directory which contains all application's classes.
     * This path will be registered via {@link Ext.Loader#setPath} for the namespace specified
     * in the {@link #name name} config.
     */
    appFolder: 'app',
    // NOTE - this config has to be processed by Ext.application

    /**
     * @cfg {String} appProperty
     * The name of a property to be assigned to the main namespace to gain a reference to
     * this application. Can be set to an empty value to prevent the reference from
     * being created
     *
     *     Ext.application({
     *         name: 'MyApp',
     *         appProperty: 'myProp',
     *
     *         launch: function() {
     *             console.log(MyApp.myProp === this);
     *         }
     *     });
     */
    appProperty: 'app',

    /**
     * @cfg {String/String[]} [namespaces]
     *
     * The list of namespace prefixes used in the application to resolve dependencies
     * like Views and Stores:
     *
     *      Ext.application({
     *          name: 'MyApp',
     *
     *          namespaces: ['Common.code'],
     *
     *          controllers: [ 'Common.code.controller.Foo', 'Bar' ]
     *      });
     *
     *      Ext.define('Common.code.controller.Foo', {
     *          extend: 'Ext.app.Controller',
     *
     *          models: ['Foo'],    // Loads Common.code.model.Foo
     *          views:  ['Bar']     // Loads Common.code.view.Bar
     *      });
     *
     *      Ext.define('MyApp.controller.Bar', {
     *          extend: 'Ext.app.Controller',
     *
     *          models: ['Foo'],    // Loads MyApp.model.Foo
     *          views:  ['Bar']     // Loads MyApp.view.Bar
     *      });
     *
     * You don't need to include main namespace (MyApp), it will be added to the list
     * automatically.
     */
    namespaces: [],

    /**
     * @cfg {Boolean} [autoCreateViewport=false]
     * True to automatically load and instantiate AppName.view.Viewport before firing the launch
     * function.
     */
    autoCreateViewport: false,

    /**
     * @cfg {Object} paths
     * Additional load paths to add to Ext.Loader.
     * See {@link Ext.Loader#paths} config for more details.
     */
    paths: null,
    
    onClassExtended: function(cls, data, hooks) {
        var Controller = Ext.app.Controller,
            proto = cls.prototype,
            requires = [],
            onBeforeClassCreated, paths, namespace, ns, appFolder;
        
        // Ordinary inheritance does not work here so we collect
        // necessary data from current class data and its superclass
        namespace = data.name      || cls.superclass.name;
        appFolder = data.appFolder || cls.superclass.appFolder;
        
        if (namespace) {
            data.$namespace = namespace;
            Ext.app.addNamespaces(namespace);
        }

        if (data.namespaces) {
            Ext.app.addNamespaces(data.namespaces);
        }

        if (!data['paths processed']) {
            if (namespace && appFolder) {
                Ext.Loader.setPath(namespace, appFolder);
            }
            
            paths = data.paths;

            if (paths) {
                for (ns in paths) {
                    if (paths.hasOwnProperty(ns)) {
                        Ext.Loader.setPath(ns, paths[ns]);
                    }
                }
            }
        }
        else {
            delete data['paths processed'];
        }

        if (data.autoCreateViewport) {
            
            Controller.processDependencies(proto, requires, namespace, 'view', ['Viewport']);
        }

        // Any "requires" also have to be processed before we fire up the App instance.
        if (requires.length) {
            onBeforeClassCreated = hooks.onBeforeCreated;

            hooks.onBeforeCreated = function(cls, data) {
                var args = Ext.Array.clone(arguments);
                
                Ext.require(requires, function () {
                    return onBeforeClassCreated.apply(this, args);
                });
            };
        }
    },

    /**
     * Creates new Application.
     * @param {Object} [config] Config object.
     */
    constructor: function(config) {
        var me = this;


        me.callParent(arguments);

        me.doInit(me);

        me.initNamespace();
        me.initControllers();
        me.onBeforeLaunch();
        
        me.finishInitControllers();
    },

    initNamespace: function() {
        var me = this,
            appProperty = me.appProperty,
            ns;

        ns = Ext.namespace(me.name);

        if (ns) {
            ns.getApplication = function() {
                return me;
            };

            if (appProperty) {
                if (!ns[appProperty]) {
                    ns[appProperty] = me;
                }
            }
        }
    },

    initControllers: function() {
        var me = this,
            controllers = Ext.Array.from(me.controllers);

        me.controllers = new Ext.util.MixedCollection();

        for (var i = 0, ln = controllers.length; i < ln; i++) {
            me.getController(controllers[i]);
        }
    },
    
    finishInitControllers: function() {
        var me = this,
            controllers, i, l;
        
        controllers = me.controllers.getRange();
        
        for (i = 0, l = controllers.length; i < l; i++) {
            controllers[i].finishInit(me);
        }
    },

    /**
     * @method
     * @template
     * Called automatically when the page has completely loaded. This is an empty function that should be
     * overridden by each application that needs to take action on page load.
     * @param {String} profile The detected application profile
     * @return {Boolean} By default, the Application will dispatch to the configured startup controller and
     * action immediately after running the launch function. Return false to prevent this behavior.
     */
    launch: Ext.emptyFn,

    /**
     * @private
     */
    onBeforeLaunch: function() {
        var me = this,
            controllers, c, cLen, controller;

        if (me.enableQuickTips) {
            me.initQuickTips();
        }

        if (me.autoCreateViewport) {
            me.initViewport();
        }

        me.launch.call(me.scope || me);
        me.launched = true;
        me.fireEvent('launch', me);

        controllers = me.controllers.items;
        cLen        = controllers.length;

        for (c = 0; c < cLen; c++) {
            controller = controllers[c];
            controller.onLaunch(me);
        }
    },

    getModuleClassName: function(name, kind) {
        return Ext.app.Controller.getFullName(name, kind, this.name).absoluteName;
    },

    initQuickTips: function() {
        Ext.tip.QuickTipManager.init();
    },

    initViewport: function() {
        var viewport = this.getView('Viewport');

        if (viewport) {
            viewport.create();
        }
    },

    getController: function(name) {
        var me          = this,
            controllers = me.controllers,
            className, controller;

        controller = controllers.get(name);

        if (!controller) {
            className  = me.getModuleClassName(name, 'controller');

            controller = Ext.create(className, {
                application: me,
                id:          name
            });

            controllers.add(controller);

            if (me._initialized) {
                controller.doInit(me);
            }
        }

        return controller;
    },

    getApplication: function() {
        return this;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class implements the controller event domain. All classes extending from
 * {@link Ext.app.Controller} are included in this domain. The selectors are simply id's or the
 * wildcard "*" to match any controller.
 * 
 * @protected
 */
Ext.define('Ext.app.domain.Controller', {
    extend:  Ext.app.EventDomain ,
    singleton: true,

               
                            
      

    type: 'controller',
    idProperty: 'id',

    constructor: function() {
        var me = this;
        
        me.callParent();
        me.monitor(Ext.app.Controller);
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @author Ed Spencer
 *
 * The XML Reader is used by a Proxy to read a server response that is sent back in XML format. This usually happens as
 * a result of loading a Store - for example we might create something like this:
 *
 *     Ext.define('User', {
 *         extend: 'Ext.data.Model',
 *         fields: ['id', 'name', 'email']
 *     });
 *
 *     var store = Ext.create('Ext.data.Store', {
 *         model: 'User',
 *         proxy: {
 *             type: 'ajax',
 *             url : 'users.xml',
 *             reader: {
 *                 type: 'xml',
 *                 record: 'user',
 *                 root: 'users'
 *             }
 *         }
 *     });
 *
 * The example above creates a 'User' model. Models are explained in the {@link Ext.data.Model Model} docs if you're not
 * already familiar with them.
 *
 * We created the simplest type of XML Reader possible by simply telling our {@link Ext.data.Store Store}'s {@link
 * Ext.data.proxy.Proxy Proxy} that we want a XML Reader. The Store automatically passes the configured model to the
 * Store, so it is as if we passed this instead:
 *
 *     reader: {
 *         type : 'xml',
 *         model: 'User',
 *         record: 'user',
 *         root: 'users'
 *     }
 *
 * The reader we set up is ready to read data from our server - at the moment it will accept a response like this:
 *
 *     <?xml version="1.0" encoding="UTF-8"?>
 *     <users>
 *         <user>
 *             <id>1</id>
 *             <name>Ed Spencer</name>
 *             <email>ed@sencha.com</email>
 *         </user>
 *         <user>
 *             <id>2</id>
 *             <name>Abe Elias</name>
 *             <email>abe@sencha.com</email>
 *         </user>
 *     </users>
 *
 * First off there's {@link #root} option to define the root node `<users>` (there should be only one in a well-formed
 * XML document). Then the XML Reader uses the configured {@link #record} option to pull out the data for each record -
 * in this case we set record to 'user', so each `<user>` above will be converted into a User model.
 *
 * Note that XmlReader doesn't care whether your {@link #root} and {@link #record} elements are nested deep inside a
 * larger structure, so a response like this will still work:
 *
 *     <?xml version="1.0" encoding="UTF-8"?>
 *     <deeply>
 *         <nested>
 *             <xml>
 *                 <users>
 *                     <user>
 *                         <id>1</id>
 *                         <name>Ed Spencer</name>
 *                         <email>ed@sencha.com</email>
 *                     </user>
 *                     <user>
 *                         <id>2</id>
 *                         <name>Abe Elias</name>
 *                         <email>abe@sencha.com</email>
 *                     </user>
 *                 </users>
 *             </xml>
 *         </nested>
 *     </deeply>
 *
 * If this Reader is being used by a {@link Ext.data.TreeStore TreeStore} to read tree-structured data in which records
 * are nested as descendant nodes of other records, then this lenient behaviour must be overridden by using a more specific
 * child node selector as your {@link #record} selector which will not select all descendants, such as:
 *
 *    record: '>user'
 *
 * # Response metadata
 *
 * The server can return additional data in its response, such as the {@link #totalProperty total number of records} and
 * the {@link #successProperty success status of the response}. These are typically included in the XML response like
 * this:
 *
 *     <?xml version="1.0" encoding="UTF-8"?>
 *     <users>
 *         <total>100</total>
 *         <success>true</success>
 *         <user>
 *             <id>1</id>
 *             <name>Ed Spencer</name>
 *             <email>ed@sencha.com</email>
 *         </user>
 *         <user>
 *             <id>2</id>
 *             <name>Abe Elias</name>
 *             <email>abe@sencha.com</email>
 *         </user>
 *     </users>
 *
 * If these properties are present in the XML response they can be parsed out by the XmlReader and used by the Store
 * that loaded it. We can set up the names of these properties by specifying a final pair of configuration options:
 *
 *     reader: {
 *         type: 'xml',
 *         root: 'users',
 *         totalProperty  : 'total',
 *         successProperty: 'success'
 *     }
 *
 * These final options are not necessary to make the Reader work, but can be useful when the server needs to report an
 * error or if it needs to indicate that there is a lot of data available of which only a subset is currently being
 * returned.
 *
 * # Response format
 *
 * **Note:** in order for the browser to parse a returned XML document, the Content-Type header in the HTTP response
 * must be set to "text/xml" or "application/xml". This is very important - the XmlReader will not work correctly
 * otherwise.
 */
Ext.define('Ext.data.reader.Xml', {
    extend:  Ext.data.reader.Reader ,
    alternateClassName: 'Ext.data.XmlReader',
    alias : 'reader.xml',

    /**
     * @cfg {String} record (required)
     * The DomQuery path to the repeated element which contains record information.
     *
     * By default, the elements which match the selector may be nested at any level below the {@link #root}
     *
     * If this Reader is being used by a {@link Ext.data.TreeStore TreeStore} to read tree-structured data,
     * then only first generation child nodes of the root element must be selected, so the record selector must be
     * specified with a more specific selector which will not select all descendants. For example:
     *
     *    record: '>node'
     *
     */

    /**
     * @cfg {String} namespace
     * A namespace prefix that will be prepended to the field name when reading a
     * field from an XML node.  Take, for example, the following Model:
     * 
     *     Ext.define('Foo', {
     *         extend: 'Ext.data.Model',
     *         fields: ['bar', 'baz']
     *     });
     *     
     * The reader would need to be configured with a namespace of 'n' in order to read XML
     * data in the following format:
     * 
     *     <foo>
     *         <n:bar>bar</n:bar>
     *         <n:baz>baz</n:baz>
     *     </foo>
     */

    /**
     * @private
     * Creates a function to return some particular key of data from a response. The totalProperty and
     * successProperty are treated as special cases for type casting, everything else is just a simple selector.
     * @param {String} key
     * @return {Function}
     */
    createAccessor: function(expr) {
        var me = this;

        if (Ext.isEmpty(expr)) {
            return Ext.emptyFn;
        }

        if (Ext.isFunction(expr)) {
            return expr;
        }

        return function(root) {
            return me.getNodeValue(Ext.DomQuery.selectNode(expr, root));
        };
    },

    getNodeValue: function(node) {
        if (node) {
            // overcome a limitation of maximum textnode size
            // http://reference.sitepoint.com/javascript/Node/normalize
            // https://developer.mozilla.org/En/DOM/Node.normalize
            if (typeof node.normalize === 'function') {
                node.normalize();
            }
            node = node.firstChild;
            if (node) {
                return node.nodeValue;
            }
        }
        return undefined;
    },

    //inherit docs
    getResponseData: function(response) {
        var xml = response.responseXML,
            error,
            msg;

        if (!xml) {
            msg = 'XML data not found in the response';               

            error = new Ext.data.ResultSet({
                total  : 0,
                count  : 0,
                records: [],
                success: false,
                message: msg
            });

            this.fireEvent('exception', this, response, error);

            Ext.Logger.warn(msg);

            return error;
        }

        return this.readRecords(xml);
    },

    /**
     * Normalizes the data object.
     * @param {Object} data The raw data object
     * @return {Object} The documentElement property of the data object if present, or the same object if not.
     */
    getData: function(data) {
        return data.documentElement || data;
    },

    /**
     * @private
     * Given an XML object, returns the Element that represents the root as configured by the Reader's meta data.
     * @param {Object} data The XML data object
     * @return {XMLElement} The root node element
     */
    getRoot: function(data) {
        var nodeName = data.nodeName,
            root     = this.root;

        if (!root || (nodeName && nodeName == root)) {
            return data;
        } else if (Ext.DomQuery.isXml(data)) {
            // This fix ensures we have XML data
            // Related to TreeStore calling getRoot with the root node, which isn't XML
            // Probably should be resolved in TreeStore at some point
            return Ext.DomQuery.selectNode(root, data);
        }
    },

    /**
     * @private
     * We're just preparing the data for the superclass by pulling out the record nodes we want.
     * @param {XMLElement} root The XML root node
     * @return {Ext.data.Model[]} The records
     */
    extractData: function(root) {
        var recordName = this.record;


        if (recordName != root.nodeName) {
            root = Ext.DomQuery.select(recordName, root);
        } else {
            root = [root];
        }
        return this.callParent([root]);
    },

    /**
     * @private
     * See Ext.data.reader.Reader's getAssociatedDataRoot docs.
     * @param {Object} data The raw data object
     * @param {String} associationName The name of the association to get data for (uses associationKey if present)
     * @return {XMLElement} The root
     */
    getAssociatedDataRoot: function(data, associationName) {
        return Ext.DomQuery.select(associationName, data)[0];
    },

    /**
     * Parses an XML document and returns a ResultSet containing the model instances.
     * @param {Object} doc Parsed XML document
     * @return {Ext.data.ResultSet} The parsed result set
     */
    readRecords: function(doc) {
        // it's possible that we get passed an array here by associations.
        // Make sure we strip that out (see Ext.data.reader.Reader#readAssociated)
        if (Ext.isArray(doc)) {
            doc = doc[0];
        }

        /**
         * @property {Object} xmlData
         * Copy of {@link #rawData}.
         * @deprecated Will be removed in Ext JS 5.0. Use {@link #rawData} instead.
         */
        this.xmlData = doc;
        return this.callParent([doc]);
    },

    /**
     * @private
     * Returns an accessor expression for the passed Field from an XML element using either the Field's mapping, or
     * its ordinal position in the fields collsction as the index.
     * This is used by buildExtractors to create optimized on extractor function which converts raw data into model instances.
     */
    createFieldAccessExpression: function(field, fieldVarName, dataName) {
        var namespace = this.namespace,
            selector, result;

        selector = field.mapping || ((namespace ? namespace + '|' : '') + field.name); 

        if (typeof selector === 'function') {
            result = fieldVarName + '.mapping(' + dataName + ', this)';
        } else {
            result = 'me.getNodeValue(Ext.DomQuery.selectNode("' + selector + '", ' + dataName + '))';
        }
        return result;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * The subclasses of this class provide actions to perform upon {@link Ext.form.Basic Form}s.
 *
 * Instances of this class are only created by a {@link Ext.form.Basic Form} when the Form needs to perform an action
 * such as submit or load. The Configuration options listed for this class are set through the Form's action methods:
 * {@link Ext.form.Basic#submit submit}, {@link Ext.form.Basic#load load} and {@link Ext.form.Basic#doAction doAction}
 *
 * The instance of Action which performed the action is passed to the success and failure callbacks of the Form's action
 * methods ({@link Ext.form.Basic#submit submit}, {@link Ext.form.Basic#load load} and
 * {@link Ext.form.Basic#doAction doAction}), and to the {@link Ext.form.Basic#actioncomplete actioncomplete} and
 * {@link Ext.form.Basic#actionfailed actionfailed} event handlers.
 */
Ext.define('Ext.form.action.Action', {
    alternateClassName: 'Ext.form.Action',

    /**
     * @cfg {Ext.form.Basic} form
     * The {@link Ext.form.Basic BasicForm} instance that is invoking this Action. Required.
     */

    /**
     * @cfg {String} url
     * The URL that the Action is to invoke. Will default to the {@link Ext.form.Basic#url url} configured on the
     * {@link #form}.
     */

    /**
     * @cfg {Boolean} reset
     * When set to **true**, causes the Form to be {@link Ext.form.Basic#reset reset} on Action success. If specified,
     * this happens before the {@link #success} callback is called and before the Form's
     * {@link Ext.form.Basic#actioncomplete actioncomplete} event fires.
     */

    /**
     * @cfg {String} method
     * The HTTP method to use to access the requested URL.
     * Defaults to the {@link Ext.form.Basic#method BasicForm's method}, or 'POST' if not specified.
     */

    /**
     * @cfg {Object/String} params
     * Extra parameter values to pass. These are added to the Form's {@link Ext.form.Basic#baseParams} and passed to the
     * specified URL along with the Form's input fields.
     *
     * Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode Ext.Object.toQueryString}.
     */

    /**
     * @cfg {Object} headers
     * Extra headers to be sent in the AJAX request for submit and load actions.
     * See {@link Ext.data.proxy.Ajax#headers}.
     * 
     * **Note:** Headers are not sent during file upload.
     */

    /**
     * @cfg {Number} timeout
     * The number of seconds to wait for a server response before failing with the {@link #failureType} as
     * {@link Ext.form.action.Action#CONNECT_FAILURE}. If not specified, defaults to the configured
     * {@link Ext.form.Basic#timeout timeout} of the {@link #form}.
     */

    /**
     * @cfg {Function} success
     * The function to call when a valid success return packet is received.
     * @cfg {Ext.form.Basic} success.form The form that requested the action
     * @cfg {Ext.form.action.Action} success.action The Action class. The {@link #result} property of this object may
     * be examined to perform custom postprocessing.
     */

    /**
     * @cfg {Function} failure
     * The function to call when a failure packet was received, or when an error ocurred in the Ajax communication.
     * @cfg {Ext.form.Basic} failure.form The form that requested the action
     * @cfg {Ext.form.action.Action} failure.action The Action class. If an Ajax error ocurred, the failure type will
     * be in {@link #failureType}. The {@link #result} property of this object may be examined to perform custom
     * postprocessing.
     */

    /**
     * @cfg {Object} scope
     * The scope in which to call the configured #success and #failure callback functions
     * (the `this` reference for the callback functions).
     */

    /**
     * @cfg {String} waitMsg
     * The message to be displayed by a call to {@link Ext.window.MessageBox#wait} during the time the action is being
     * processed.
     */

    /**
     * @cfg {String} waitTitle
     * The title to be displayed by a call to {@link Ext.window.MessageBox#wait} during the time the action is being
     * processed.
     */

    /**
     * @cfg {Boolean} submitEmptyText
     * If set to true, the emptyText value will be sent with the form when it is submitted.
     */
    submitEmptyText : true,

    /**
     * @property {String} type
     * The type of action this Action instance performs. Currently only "submit" and "load" are supported.
     */

    /**
     * @property {String} failureType
     * The type of failure detected will be one of these:
     * {@link #CLIENT_INVALID}, {@link #SERVER_INVALID}, {@link #CONNECT_FAILURE}, or {@link #LOAD_FAILURE}.
     *
     * Usage:
     *
     *     var fp = new Ext.form.Panel({
     *     ...
     *     buttons: [{
     *         text: 'Save',
     *         formBind: true,
     *         handler: function(){
     *             if(fp.getForm().isValid()){
     *                 fp.getForm().submit({
     *                     url: 'form-submit.php',
     *                     waitMsg: 'Submitting your data...',
     *                     success: function(form, action){
     *                         // server responded with success = true
     *                         var result = action.{@link #result};
     *                     },
     *                     failure: function(form, action){
     *                         if (action.{@link #failureType} === Ext.form.action.Action.CONNECT_FAILURE) {
     *                             Ext.Msg.alert('Error',
     *                                 'Status:'+action.{@link #response}.status+': '+
     *                                 action.{@link #response}.statusText);
     *                         }
     *                         if (action.failureType === Ext.form.action.Action.SERVER_INVALID){
     *                             // server responded with success = false
     *                             Ext.Msg.alert('Invalid', action.{@link #result}.errormsg);
     *                         }
     *                     }
     *                 });
     *             }
     *         }
     *     },{
     *         text: 'Reset',
     *         handler: function(){
     *             fp.getForm().reset();
     *         }
     *     }]
     */

    /**
     * @property {Object} response
     * The raw XMLHttpRequest object used to perform the action.
     */

    /**
     * @property {Object} result
     * The decoded response object containing a boolean `success` property and other, action-specific properties.
     */

    /**
     * Creates new Action.
     * @param {Object} [config] Config object.
     */
    constructor: function(config) {
        if (config) {
            Ext.apply(this, config);
        }

        // Normalize the params option to an Object
        var params = config.params;
        if (Ext.isString(params)) {
            this.params = Ext.Object.fromQueryString(params);
        }
    },

    /**
     * @method
     * Invokes this action using the current configuration.
     */
    run: Ext.emptyFn,

    /**
     * @private
     * @method onSuccess
     * Callback method that gets invoked when the action completes successfully. Must be implemented by subclasses.
     * @param {Object} response
     */

    /**
     * @private
     * @method handleResponse
     * Handles the raw response and builds a result object from it. Must be implemented by subclasses.
     * @param {Object} response
     */

    /**
     * @private
     * Handles a failure response.
     * @param {Object} response
     */
    onFailure : function(response){
        this.response = response;
        this.failureType = Ext.form.action.Action.CONNECT_FAILURE;
        this.form.afterAction(this, false);
    },

    /**
     * @private
     * Validates that a response contains either responseText or responseXML and invokes
     * {@link #handleResponse} to build the result object.
     * @param {Object} response The raw response object.
     * @return {Object/Boolean} The result object as built by handleResponse, or `true` if
     * the response had empty responseText and responseXML.
     */
    processResponse : function(response){
        this.response = response;
        if (!response.responseText && !response.responseXML) {
            return true;
        }
        return (this.result = this.handleResponse(response));
    },

    /**
     * @private
     * Build the URL for the AJAX request. Used by the standard AJAX submit and load actions.
     * @return {String} The URL.
     */
    getUrl: function() {
        return this.url || this.form.url;
    },

    /**
     * @private
     * Determine the HTTP method to be used for the request.
     * @return {String} The HTTP method
     */
    getMethod: function() {
        return (this.method || this.form.method || 'POST').toUpperCase();
    },

    /**
     * @private
     * Get the set of parameters specified in the BasicForm's baseParams and/or the params option.
     * Items in params override items of the same name in baseParams.
     * @return {Object} the full set of parameters
     */
    getParams: function() {
        return Ext.apply({}, this.params, this.form.baseParams);
    },

    /**
     * @private
     * Creates a callback object.
     */
    createCallback: function() {
        var me = this,
            undef,
            form = me.form;
        return {
            success: me.onSuccess,
            failure: me.onFailure,
            scope: me,
            timeout: (this.timeout * 1000) || (form.timeout * 1000),
            upload: form.fileUpload ? me.onSuccess : undef
        };
    },

    statics: {
        /**
         * @property
         * Failure type returned when client side validation of the Form fails thus aborting a submit action. Client
         * side validation is performed unless {@link Ext.form.action.Submit#clientValidation} is explicitly set to
         * false.
         * @static
         */
        CLIENT_INVALID: 'client',

        /**
         * @property
         * Failure type returned when server side processing fails and the {@link #result}'s `success` property is set to
         * false.
         *
         * In the case of a form submission, field-specific error messages may be returned in the {@link #result}'s
         * errors property.
         * @static
         */
        SERVER_INVALID: 'server',

        /**
         * @property
         * Failure type returned when a communication error happens when attempting to send a request to the remote
         * server. The {@link #response} may be examined to provide further information.
         * @static
         */
        CONNECT_FAILURE: 'connect',

        /**
         * @property
         * Failure type returned when the response's `success` property is set to false, or no field values are returned
         * in the response's data property.
         * @static
         */
        LOAD_FAILURE: 'load'


    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * A class which handles loading of data from a server into the Fields of an {@link Ext.form.Basic}.
 *
 * Instances of this class are only created by a {@link Ext.form.Basic Form} when {@link Ext.form.Basic#load load}ing.
 *
 * ## Response Packet Criteria
 *
 * A response packet **must** contain:
 *
 *   - **`success`** property : Boolean
 *   - **`data`** property : Object
 *
 * The `data` property contains the values of Fields to load. The individual value object for each Field is passed to
 * the Field's {@link Ext.form.field.Field#setValue setValue} method.
 *
 * ## JSON Packets
 *
 * By default, response packets are assumed to be JSON, so for the following form load call:
 *
 *     var myFormPanel = new Ext.form.Panel({
 *         title: 'Client and routing info',
 *         renderTo: Ext.getBody(),
 *         defaults: {
 *             xtype: 'textfield'
 *         },
 *         items: [{
 *             fieldLabel: 'Client',
 *             name: 'clientName'
 *         }, {
 *             fieldLabel: 'Port of loading',
 *             name: 'portOfLoading'
 *         }, {
 *             fieldLabel: 'Port of discharge',
 *             name: 'portOfDischarge'
 *         }]
 *     });
 *     myFormPanel.{@link Ext.form.Panel#getForm getForm}().{@link Ext.form.Basic#load load}({
 *         url: '/getRoutingInfo.php',
 *         params: {
 *             consignmentRef: myConsignmentRef
 *         },
 *         failure: function(form, action) {
 *             Ext.Msg.alert("Load failed", action.result.errorMessage);
 *         }
 *     });
 *
 * a **success response** packet may look like this:
 *
 *     {
 *         success: true,
 *         data: {
 *             clientName: "Fred. Olsen Lines",
 *             portOfLoading: "FXT",
 *             portOfDischarge: "OSL"
 *         }
 *     }
 *
 * while a **failure response** packet may look like this:
 *
 *     {
 *         success: false,
 *         errorMessage: "Consignment reference not found"
 *     }
 *
 * Other data may be placed into the response for processing the {@link Ext.form.Basic Form}'s callback or event handler
 * methods. The object decoded from this JSON is available in the {@link Ext.form.action.Action#result result} property.
 */
Ext.define('Ext.form.action.Load', {
    extend: Ext.form.action.Action ,
                                      
    alternateClassName: 'Ext.form.Action.Load',
    alias: 'formaction.load',

    type: 'load',

    /**
     * @private
     */
    run: function() {
        Ext.Ajax.request(Ext.apply(
            this.createCallback(),
            {
                method: this.getMethod(),
                url: this.getUrl(),
                headers: this.headers,
                params: this.getParams()
            }
        ));
    },

    /**
     * @private
     */
    onSuccess: function(response){
        var result = this.processResponse(response),
            form = this.form;
        if (result === true || !result.success || !result.data) {
            this.failureType = Ext.form.action.Action.LOAD_FAILURE;
            form.afterAction(this, false);
            return;
        }
        form.clearInvalid();
        form.setValues(result.data);
        form.afterAction(this, true);
    },

    /**
     * @private
     */
    handleResponse: function(response) {
        var reader = this.form.reader,
            rs, data;
        if (reader) {
            rs = reader.read(response);
            data = rs.records && rs.records[0] ? rs.records[0].data : null;
            return {
                success : rs.success,
                data : data
            };
        }
        return Ext.decode(response.responseText);
    }
});


/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * A class which handles submission of data from {@link Ext.form.Basic Form}s and processes the returned response.
 *
 * Instances of this class are only created by a {@link Ext.form.Basic Form} when
 * {@link Ext.form.Basic#submit submit}ting.
 *
 * # Response Packet Criteria
 *
 * A response packet may contain:
 *
 *   - **`success`** property : Boolean - required.
 *
 *   - **`errors`** property : Object - optional, contains error messages for invalid fields.
 *
 * # JSON Packets
 *
 * By default, response packets are assumed to be JSON, so a typical response packet may look like this:
 *
 *     {
 *         success: false,
 *         errors: {
 *             clientCode: "Client not found",
 *             portOfLoading: "This field must not be null"
 *         }
 *     }
 *
 * Other data may be placed into the response for processing by the {@link Ext.form.Basic}'s callback or event handler
 * methods. The object decoded from this JSON is available in the {@link Ext.form.action.Action#result result} property.
 *
 * Alternatively, if an {@link Ext.form.Basic#errorReader errorReader} is specified as an
 * {@link Ext.data.reader.Xml XmlReader}:
 *
 *     errorReader: new Ext.data.reader.Xml({
 *             record : 'field',
 *             success: '@success'
 *         }, [
 *             'id', 'msg'
 *         ]
 *     )
 *
 * then the results may be sent back in XML format:
 *
 *     <?xml version="1.0" encoding="UTF-8"?>
 *     <message success="false">
 *     <errors>
 *         <field>
 *             <id>clientCode</id>
 *             <msg><![CDATA[Code not found. <br /><i>This is a test validation message from the server </i>]]></msg>
 *         </field>
 *         <field>
 *             <id>portOfLoading</id>
 *             <msg><![CDATA[Port not found. <br /><i>This is a test validation message from the server </i>]]></msg>
 *         </field>
 *     </errors>
 *     </message>
 *
 * Other elements may be placed into the response XML for processing by the {@link Ext.form.Basic}'s callback or event
 * handler methods. The XML document is available in the {@link Ext.form.Basic#errorReader errorReader}'s
 * {@link Ext.data.reader.Xml#xmlData xmlData} property.
 */
Ext.define('Ext.form.action.Submit', {
    extend: Ext.form.action.Action ,
    alternateClassName: 'Ext.form.Action.Submit',
    alias: 'formaction.submit',

    type: 'submit',

    /**
     * @cfg {Boolean} [clientValidation=true]
     * Determines whether a Form's fields are validated in a final call to {@link Ext.form.Basic#isValid isValid} prior
     * to submission. Pass false in the Form's submit options to prevent this.
     */

    // inherit docs
    run : function(){
        var me = this,
            form = me.form;
            
        if (me.clientValidation === false || form.isValid()) {
            me.doSubmit();
        } else {
            // client validation failed
            me.failureType = Ext.form.action.Action.CLIENT_INVALID;
            form.afterAction(me, false);
        }
    },

    /**
     * @private
     * Performs the submit of the form data.
     */
    doSubmit: function() {
        var me = this,
            ajaxOptions = Ext.apply(me.createCallback(), {
                url: me.getUrl(),
                method: me.getMethod(),
                headers: me.headers
            }),
            form = me.form,
            jsonSubmit = me.jsonSubmit || form.jsonSubmit,
            paramsProp = jsonSubmit ? 'jsonData' : 'params',
            formEl, formInfo;

        // For uploads we need to create an actual form that contains the file upload fields,
        // and pass that to the ajax call so it can do its iframe-based submit method.
        if (form.hasUpload()) {
            formInfo = me.buildForm();
            ajaxOptions.form = formInfo.formEl;
            ajaxOptions.isUpload = true;
        } else {
            ajaxOptions[paramsProp] = me.getParams(jsonSubmit);
        }

        Ext.Ajax.request(ajaxOptions);
        if (formInfo) {
            me.cleanup(formInfo);
        }
    },
    
    cleanup: function(formInfo) {
        var formEl = formInfo.formEl,
            uploadEls = formInfo.uploadEls,
            uploadFields = formInfo.uploadFields,
            len = uploadFields.length,
            i, field;
            
        for (i = 0; i < len; ++i) {
            field = uploadFields[i];
            if (!field.clearOnSubmit) {
                field.restoreInput(uploadEls[i]);
            }    
        }
        
        if (formEl) {
            Ext.removeNode(formEl);
        }    
    },

    /**
     * @private
     * Builds the full set of parameters from the field values plus any additional configured params.
     */
    getParams: function(useModelValues) {
        var falseVal = false,
            configParams = this.callParent(),
            fieldParams = this.form.getValues(falseVal, falseVal, this.submitEmptyText !== falseVal, useModelValues);
        return Ext.apply({}, fieldParams, configParams);
    },

    /**
     * @private
     * Builds a form element containing fields corresponding to all the parameters to be
     * submitted (everything returned by {@link #getParams}.
     *
     * NOTE: the form element is automatically added to the DOM, so any code that uses
     * it must remove it from the DOM after finishing with it.
     *
     * @return {HTMLElement}
     */
    buildForm: function() {
        var me = this,
            fieldsSpec = [],
            formSpec,
            formEl,
            basicForm = me.form,
            params = me.getParams(),
            uploadFields = [],
            uploadEls = [],
            fields = basicForm.getFields().items,
            i,
            len   = fields.length,
            field, key, value, v, vLen,
            el;

        for (i = 0; i < len; ++i) {
            field = fields[i];

            // can only have a selected file value after being rendered
            if (field.rendered && field.isFileUpload()) {
                uploadFields.push(field);
            }
        }

        for (key in params) {
            if (params.hasOwnProperty(key)) {
                value = params[key];

                if (Ext.isArray(value)) {
                    vLen = value.length;
                    for (v = 0; v < vLen; v++) {
                        fieldsSpec.push(me.getFieldConfig(key, value[v]));
                    }
                } else {
                    fieldsSpec.push(me.getFieldConfig(key, value));
                }
            }
        }

        formSpec = {
            tag: 'form',
            action: me.getUrl(),
            method: me.getMethod(),
            target: me.target || '_self',
            style: 'display:none',
            cn: fieldsSpec
        };

        // Set the proper encoding for file uploads
        if (uploadFields.length) {
            formSpec.encoding = formSpec.enctype = 'multipart/form-data';
        }

        // Create the form
        formEl = Ext.DomHelper.append(Ext.getBody(), formSpec);

        // Special handling for file upload fields: since browser security measures prevent setting
        // their values programatically, and prevent carrying their selected values over when cloning,
        // we have to move the actual field instances out of their components and into the form.
        len = uploadFields.length;

        for (i = 0; i < len; ++i) {
            el = uploadFields[i].extractFileInput();
            formEl.appendChild(el);
            uploadEls.push(el);
        }

        return {
            formEl: formEl,
            uploadFields: uploadFields,
            uploadEls: uploadEls
        };
    },

    getFieldConfig: function(name, value) {
        return {
            tag: 'input',
            type: 'hidden',
            name: name,
            value: Ext.String.htmlEncode(value)
        };
    },

    /**
     * @private
     */
    onSuccess: function(response) {
        var form = this.form,
            success = true,
            result = this.processResponse(response);
        if (result !== true && !result.success) {
            if (result.errors) {
                form.markInvalid(result.errors);
            }
            this.failureType = Ext.form.action.Action.SERVER_INVALID;
            success = false;
        }
        form.afterAction(this, success);
    },

    /**
     * @private
     */
    handleResponse: function(response) {
        var form = this.form,
            errorReader = form.errorReader,
            rs, errors, i, len, records, result;
            
        if (errorReader) {
            rs = errorReader.read(response);
            records = rs.records;
            errors = [];
            if (records) {
                for(i = 0, len = records.length; i < len; i++) {
                    errors[i] = records[i].data;
                }
            }
            if (errors.length < 1) {
                errors = null;
            }
            result = {
                success : rs.success,
                errors : errors
            };
        } else {
            try {
                result = Ext.decode(response.responseText);    
            } catch (e) {
                result = {
                    success: false,
                    errors: []
                };
            }
            
        }
        return result;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Provides input field management, validation, submission, and form loading services for the collection
 * of {@link Ext.form.field.Field Field} instances within a {@link Ext.container.Container}. It is recommended
 * that you use a {@link Ext.form.Panel} as the form container, as that has logic to automatically
 * hook up an instance of {@link Ext.form.Basic} (plus other conveniences related to field configuration.)
 *
 * ## Form Actions
 *
 * The Basic class delegates the handling of form loads and submits to instances of {@link Ext.form.action.Action}.
 * See the various Action implementations for specific details of each one's functionality, as well as the
 * documentation for {@link #doAction} which details the configuration options that can be specified in
 * each action call.
 *
 * The default submit Action is {@link Ext.form.action.Submit}, which uses an Ajax request to submit the
 * form's values to a configured URL. To enable normal browser submission of an Ext form, use the
 * {@link #standardSubmit} config option.
 *
 * ## File uploads
 *
 * File uploads are not performed using normal 'Ajax' techniques; see the description for
 * {@link #hasUpload} for details. If you're using file uploads you should read the method description.
 *
 * ## Example usage:
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'Basic Form',
 *         renderTo: Ext.getBody(),
 *         bodyPadding: 5,
 *         width: 350,
 *
 *         // Any configuration items here will be automatically passed along to
 *         // the Ext.form.Basic instance when it gets created.
 *
 *         // The form will submit an AJAX request to this URL when submitted
 *         url: 'save-form.php',
 *
 *         items: [{
 *             xtype: 'textfield',
 *             fieldLabel: 'Field',
 *             name: 'theField'
 *         }],
 *
 *         buttons: [{
 *             text: 'Submit',
 *             handler: function() {
 *                 // The getForm() method returns the Ext.form.Basic instance:
 *                 var form = this.up('form').getForm();
 *                 if (form.isValid()) {
 *                     // Submit the Ajax request and handle the response
 *                     form.submit({
 *                         success: function(form, action) {
 *                            Ext.Msg.alert('Success', action.result.message);
 *                         },
 *                         failure: function(form, action) {
 *                             Ext.Msg.alert('Failed', action.result ? action.result.message : 'No response');
 *                         }
 *                     });
 *                 }
 *             }
 *         }]
 *     });
 *
 * @docauthor Jason Johnston <jason@sencha.com>
 */
Ext.define('Ext.form.Basic', {
    extend:  Ext.util.Observable ,
    alternateClassName: 'Ext.form.BasicForm',
                                                                                            
                                                                                   

    /**
     * Creates new form.
     * @param {Ext.container.Container} owner The component that is the container for the form, usually a {@link Ext.form.Panel}
     * @param {Object} config Configuration options. These are normally specified in the config to the
     * {@link Ext.form.Panel} constructor, which passes them along to the BasicForm automatically.
     */
    constructor: function(owner, config) {
        var me = this,
            reader;

        /**
         * @property {Ext.container.Container} owner
         * The container component to which this BasicForm is attached.
         */
        me.owner = owner;
        
        me.checkValidityTask = new Ext.util.DelayedTask(me.checkValidity, me);
        me.checkDirtyTask = new Ext.util.DelayedTask(me.checkDirty, me);
        
        // We use the monitor here as opposed to event bubbling. The problem with bubbling is it doesn't
        // let us react to items being added/remove at different places in the hierarchy which may have an
        // impact on the dirty/valid state.
        me.monitor = new Ext.container.Monitor({
            selector: '[isFormField]',
            scope: me,
            addHandler: me.onFieldAdd,
            removeHandler: me.onFieldRemove
        });
        me.monitor.bind(owner);

        Ext.apply(me, config);

        // Normalize the paramOrder to an Array
        if (Ext.isString(me.paramOrder)) {
            me.paramOrder = me.paramOrder.split(/[\s,|]/);
        }
        
        reader = me.reader;
        if (reader && !reader.isReader) {
            if (typeof reader === 'string') {
                reader = {
                    type: reader
                };
            }
            me.reader = Ext.createByAlias('reader.' + reader.type, reader);
        }
        
        reader = me.errorReader;
        if (reader && !reader.isReader) {
            if (typeof reader === 'string') {
                reader = {
                    type: reader
                };
            }
            me.errorReader = Ext.createByAlias('reader.' + reader.type, reader);
        }

        me.addEvents(
            /**
             * @event beforeaction
             * Fires before any action is performed. Return false to cancel the action.
             * @param {Ext.form.Basic} this
             * @param {Ext.form.action.Action} action The {@link Ext.form.action.Action} to be performed
             */
            'beforeaction',
            /**
             * @event actionfailed
             * Fires when an action fails.
             * @param {Ext.form.Basic} this
             * @param {Ext.form.action.Action} action The {@link Ext.form.action.Action} that failed
             */
            'actionfailed',
            /**
             * @event actioncomplete
             * Fires when an action is completed.
             * @param {Ext.form.Basic} this
             * @param {Ext.form.action.Action} action The {@link Ext.form.action.Action} that completed
             */
            'actioncomplete',
            /**
             * @event validitychange
             * Fires when the validity of the entire form changes.
             * @param {Ext.form.Basic} this
             * @param {Boolean} valid `true` if the form is now valid, `false` if it is now invalid.
             */
            'validitychange',
            /**
             * @event dirtychange
             * Fires when the dirty state of the entire form changes.
             * @param {Ext.form.Basic} this
             * @param {Boolean} dirty `true` if the form is now dirty, `false` if it is no longer dirty.
             */
            'dirtychange'
        );
        me.callParent();
    },

    /**
     * Do any post layout initialization
     * @private
     */
    initialize : function() {
        this.initialized = true;
        this.onValidityChange(!this.hasInvalidField());
    },


    /**
     * @cfg {String} method
     * The request method to use (GET or POST) for form actions if one isn't supplied in the action options.
     */

    /**
     * @cfg {Object/Ext.data.reader.Reader} reader
     * An Ext.data.reader.Reader (e.g. {@link Ext.data.reader.Xml}) instance or
     * configuration to be used to read data when executing 'load' actions. This 
     * is optional as there is built-in support for processing JSON responses.
     */

    /**
     * @cfg {Object/Ext.data.reader.Reader} errorReader
     * An Ext.data.reader.Reader (e.g. {@link Ext.data.reader.Xml}) instance or
     * configuration to be used to read field error messages returned from 'submit' actions. 
     * This is optional as there is built-in support for processing JSON responses.
     *
     * The Records which provide messages for the invalid Fields must use the
     * Field name (or id) as the Record ID, and must contain a field called 'msg'
     * which contains the error message.
     *
     * The errorReader does not have to be a full-blown implementation of a
     * Reader. It simply needs to implement a `read(xhr)` function
     * which returns an Array of Records in an object with the following
     * structure:
     *
     *     {
     *         records: recordArray
     *     }
     */

    /**
     * @cfg {String} url
     * The URL to use for form actions if one isn't supplied in the
     * {@link #doAction doAction} options.
     */

    /**
     * @cfg {Object} baseParams
     * Parameters to pass with all requests. e.g. baseParams: `{id: '123', foo: 'bar'}`.
     *
     * Parameters are encoded as standard HTTP parameters using {@link Ext.Object#toQueryString}.
     */

    /**
     * @cfg {Number} timeout
     * Timeout for form actions in seconds.
     */
    timeout: 30,

    /**
     * @cfg {Object} api
     * If specified, load and submit actions will be handled with {@link Ext.form.action.DirectLoad DirectLoad}
     * and {@link Ext.form.action.DirectSubmit DirectSubmit}.  Methods which have been imported by
     * {@link Ext.direct.Manager} can be specified here to load and submit forms. API methods may also be
     * specified as strings. See {@link Ext.data.proxy.Direct#directFn}.  Such as the following:
     *
     *     api: {
     *         load: App.ss.MyProfile.load,
     *         submit: App.ss.MyProfile.submit
     *     }
     *
     * Load actions can use {@link #paramOrder} or {@link #paramsAsHash} to customize how the load method
     * is invoked.  Submit actions will always use a standard form submit. The `formHandler` configuration
     * (see Ext.direct.RemotingProvider#action) must be set on the associated server-side method which has
     * been imported by {@link Ext.direct.Manager}.
     */

    /**
     * @cfg {String/String[]} paramOrder
     * A list of params to be executed server side. Only used for the {@link #api} `load`
     * configuration.
     *
     * Specify the params in the order in which they must be executed on the
     * server-side as either (1) an Array of String values, or (2) a String of params
     * delimited by either whitespace, comma, or pipe. For example,
     * any of the following would be acceptable:
     *
     *     paramOrder: ['param1','param2','param3']
     *     paramOrder: 'param1 param2 param3'
     *     paramOrder: 'param1,param2,param3'
     *     paramOrder: 'param1|param2|param'
     */

    /**
     * @cfg {Boolean} paramsAsHash
     * Only used for the {@link #api} `load` configuration. If true, parameters will be sent as a
     * single hash collection of named arguments. Providing a {@link #paramOrder} nullifies this
     * configuration.
     */
    paramsAsHash: false,

    //<locale>
    /**
     * @cfg {String} waitTitle
     * The default title to show for the waiting message box
     */
    waitTitle: 'Please Wait...',
    //</locale>

    /**
     * @cfg {Boolean} trackResetOnLoad
     * If set to true, {@link #reset}() resets to the last loaded or {@link #setValues}() data instead of
     * when the form was first created.
     */
    trackResetOnLoad: false,

    /**
     * @cfg {Boolean} standardSubmit
     * If set to true, a standard HTML form submit is used instead of a XHR (Ajax) style form submission.
     * All of the field values, plus any additional params configured via {@link #baseParams}
     * and/or the `options` to {@link #submit}, will be included in the values submitted in the form.
     */

    /**
     * @cfg {Boolean} jsonSubmit
     * If set to true, the field values are sent as JSON in the request body.
     * All of the field values, plus any additional params configured via {@link #baseParams}
     * and/or the `options` to {@link #submit}, will be included in the values POSTed in the body of the request.
     */

    /**
     * @cfg {String/HTMLElement/Ext.Element} waitMsgTarget
     * By default wait messages are displayed with Ext.MessageBox.wait. You can target a specific
     * element by passing it or its id or mask the form itself by passing in true.
     */


    // Private
    wasDirty: false,


    /**
     * Destroys this object.
     */
    destroy: function() {
        var me = this,
            mon = me.monitor;
        
        if (mon) {
            mon.unbind();
            me.monitor = null;
        }
        me.clearListeners();
        me.checkValidityTask.cancel();
        me.checkDirtyTask.cancel();
    },
    
    onFieldAdd: function(field){
        var me = this;
        
        me.mon(field, 'validitychange', me.checkValidityDelay, me);
        me.mon(field, 'dirtychange', me.checkDirtyDelay, me);
        if (me.initialized) {
            me.checkValidityDelay();
        }
    },
    
    onFieldRemove: function(field){
        var me = this;
        
        me.mun(field, 'validitychange', me.checkValidityDelay, me);
        me.mun(field, 'dirtychange', me.checkDirtyDelay, me);
        if (me.initialized) {
            me.checkValidityDelay();
        }
    },
    
    /**
     * Return all the {@link Ext.form.field.Field} components in the owner container.
     * @return {Ext.util.MixedCollection} Collection of the Field objects
     */
    getFields: function() {
        return this.monitor.getItems();
    },

    /**
     * @private
     * Finds and returns the set of all items bound to fields inside this form
     * @return {Ext.util.MixedCollection} The set of all bound form field items
     */
    getBoundItems: function() {
        var boundItems = this._boundItems;
        
        if (!boundItems || boundItems.getCount() === 0) {
            boundItems = this._boundItems = new Ext.util.MixedCollection();
            boundItems.addAll(this.owner.query('[formBind]'));
        }
        
        return boundItems;
    },

    /**
     * Returns true if the form contains any invalid fields. No fields will be marked as invalid
     * as a result of calling this; to trigger marking of fields use {@link #isValid} instead.
     */
    hasInvalidField: function() {
        return !!this.getFields().findBy(function(field) {
            var preventMark = field.preventMark,
                isValid;
            field.preventMark = true;
            isValid = field.isValid();
            field.preventMark = preventMark;
            return !isValid;
        });
    },

    /**
     * Returns true if client-side validation on the form is successful. Any invalid fields will be
     * marked as invalid. If you only want to determine overall form validity without marking anything,
     * use {@link #hasInvalidField} instead.
     * @return {Boolean}
     */
    isValid: function() {
        var me = this,
            invalid;
        Ext.suspendLayouts();
        invalid = me.getFields().filterBy(function(field) {
            return !field.validate();
        });
        Ext.resumeLayouts(true);
        return invalid.length < 1;
    },

    /**
     * Check whether the validity of the entire form has changed since it was last checked, and
     * if so fire the {@link #validitychange validitychange} event. This is automatically invoked
     * when an individual field's validity changes.
     */
    checkValidity: function() {
        var me = this,
            valid = !me.hasInvalidField();
        if (valid !== me.wasValid) {
            me.onValidityChange(valid);
            me.fireEvent('validitychange', me, valid);
            me.wasValid = valid;
        }
    },
    
    checkValidityDelay: function(){
        this.checkValidityTask.delay(10);
    },

    /**
     * @private
     * Handle changes in the form's validity. If there are any sub components with
     * `formBind=true` then they are enabled/disabled based on the new validity.
     * @param {Boolean} valid
     */
    onValidityChange: function(valid) {
        var boundItems = this.getBoundItems(),
            items, i, iLen, cmp;

        if (boundItems) {
            items = boundItems.items;
            iLen  = items.length;

            for (i = 0; i < iLen; i++) {
                cmp = items[i];

                if (cmp.disabled === valid) {
                    cmp.setDisabled(!valid);
                }
            }
        }
    },

    /**
     * Returns `true` if any fields in this form have changed from their original values.
     *
     * Note that if this BasicForm was configured with {@link Ext.form.Basic#trackResetOnLoad
     * trackResetOnLoad} then the Fields' *original values* are updated when the values are
     * loaded by {@link Ext.form.Basic#setValues setValues} or {@link #loadRecord}.
     *
     * @return {Boolean}
     */
    isDirty: function() {
        return !!this.getFields().findBy(function(f) {
            return f.isDirty();
        });
    },
    
    checkDirtyDelay: function(){
        this.checkDirtyTask.delay(10);
    },

    /**
     * Check whether the dirty state of the entire form has changed since it was last checked, and
     * if so fire the {@link #dirtychange dirtychange} event. This is automatically invoked
     * when an individual field's `dirty` state changes.
     */
    checkDirty: function() {
        var dirty = this.isDirty();
        if (dirty !== this.wasDirty) {
            this.fireEvent('dirtychange', this, dirty);
            this.wasDirty = dirty;
        }
    },

    /**
     * Returns `true` if the form contains a file upload field. This is used to determine the method for submitting the
     * form: File uploads are not performed using normal 'Ajax' techniques, that is they are **not** performed using
     * XMLHttpRequests. Instead a hidden `<form>` element containing all the fields is created temporarily and submitted
     * with its [target][1] set to refer to a dynamically generated, hidden `<iframe>` which is inserted into the document
     * but removed after the return data has been gathered.
     *
     * The server response is parsed by the browser to create the document for the IFRAME. If the server is using JSON
     * to send the return object, then the [Content-Type][2] header must be set to "text/html" in order to tell the
     * browser to insert the text unchanged into the document body.
     *
     * Characters which are significant to an HTML parser must be sent as HTML entities, so encode `"<"` as `"&lt;"`,
     * `"&"` as `"&amp;"` etc.
     *
     * The response text is retrieved from the document, and a fake XMLHttpRequest object is created containing a
     * responseText property in order to conform to the requirements of event handlers and callbacks.
     *
     * Be aware that file upload packets are sent with the content type [multipart/form][3] and some server technologies
     * (notably JEE) may require some custom processing in order to retrieve parameter names and parameter values from
     * the packet content.
     *
     * [1]: http://www.w3.org/TR/REC-html40/present/frames.html#adef-target
     * [2]: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.17
     * [3]: http://www.faqs.org/rfcs/rfc2388.html
     *
     * @return {Boolean}
     */
    hasUpload: function() {
        return !!this.getFields().findBy(function(f) {
            return f.isFileUpload();
        });
    },

    /**
     * Performs a predefined action (an implementation of {@link Ext.form.action.Action}) to perform application-
     * specific processing.
     *
     * @param {String/Ext.form.action.Action} action The name of the predefined action type, or instance of {@link
     * Ext.form.action.Action} to perform.
     *
     * @param {Object} [options] The options to pass to the {@link Ext.form.action.Action} that will get created,
     * if the action argument is a String.
     *
     * All of the config options listed below are supported by both the {@link Ext.form.action.Submit submit} and
     * {@link Ext.form.action.Load load} actions unless otherwise noted (custom actions could also accept other
     * config options):
     *
     * @param {String} options.url
     * The url for the action (defaults to the form's {@link #url}.)
     *
     * @param {String} options.method
     * The form method to use (defaults to the form's method, or POST if not defined)
     *
     * @param {String/Object} options.params
     * The params to pass (defaults to the form's baseParams, or none if not defined)
     *
     * Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode Ext.Object.toQueryString}.
     *
     * @param {Object} options.headers
     * Request headers to set for the action.
     *
     * @param {Function} options.success
     * The callback that will be invoked after a successful response (see top of {@link Ext.form.action.Submit submit}
     * and {@link Ext.form.action.Load load} for a description of what constitutes a successful response).
     * @param {Ext.form.Basic} options.success.form The form that requested the action.
     * @param {Ext.form.action.Action} options.success.action The Action object which performed the operation.
     * The action object contains these properties of interest:
     *
     *  - {@link Ext.form.action.Action#response response}
     *  - {@link Ext.form.action.Action#result result} - interrogate for custom postprocessing
     *  - {@link Ext.form.action.Action#type type}
     *
     * @param {Function} options.failure
     * The callback that will be invoked after a failed transaction attempt.
     * @param {Ext.form.Basic} options.failure.form The form that requested the action.
     * @param {Ext.form.action.Action} options.failure.action The Action object which performed the operation.
     * The action object contains these properties of interest:
     *
     * - {@link Ext.form.action.Action#failureType failureType}
     * - {@link Ext.form.action.Action#response response}
     * - {@link Ext.form.action.Action#result result} - interrogate for custom postprocessing
     * - {@link Ext.form.action.Action#type type}
     *
     * @param {Object} options.scope
     * The scope in which to call the callback functions (The this reference for the callback functions).
     *
     * @param {Boolean} options.clientValidation
     * Submit Action only. Determines whether a Form's fields are validated in a final call to {@link
     * Ext.form.Basic#isValid isValid} prior to submission. Set to false to prevent this. If undefined, pre-submission
     * field validation is performed.
     *
     * @return {Ext.form.Basic} this
     */
    doAction: function(action, options) {
        if (Ext.isString(action)) {
            action = Ext.ClassManager.instantiateByAlias('formaction.' + action, Ext.apply({}, options, {form: this}));
        }
        if (this.fireEvent('beforeaction', this, action) !== false) {
            this.beforeAction(action);
            Ext.defer(action.run, 100, action);
        }
        return this;
    },

    /**
     * Shortcut to {@link #doAction do} a {@link Ext.form.action.Submit submit action}. This will use the
     * {@link Ext.form.action.Submit AJAX submit action} by default. If the {@link #standardSubmit} config
     * is enabled it will use a standard form element to submit, or if the {@link #api} config is present
     * it will use the {@link Ext.form.action.DirectLoad Ext.direct.Direct submit action}.
     *
     * The following code:
     *
     *     myFormPanel.getForm().submit({
     *         clientValidation: true,
     *         url: 'updateConsignment.php',
     *         params: {
     *             newStatus: 'delivered'
     *         },
     *         success: function(form, action) {
     *            Ext.Msg.alert('Success', action.result.msg);
     *         },
     *         failure: function(form, action) {
     *             switch (action.failureType) {
     *                 case Ext.form.action.Action.CLIENT_INVALID:
     *                     Ext.Msg.alert('Failure', 'Form fields may not be submitted with invalid values');
     *                     break;
     *                 case Ext.form.action.Action.CONNECT_FAILURE:
     *                     Ext.Msg.alert('Failure', 'Ajax communication failed');
     *                     break;
     *                 case Ext.form.action.Action.SERVER_INVALID:
     *                    Ext.Msg.alert('Failure', action.result.msg);
     *            }
     *         }
     *     });
     *
     * would process the following server response for a successful submission:
     *
     *     {
     *         "success":true, // note this is Boolean, not string
     *         "msg":"Consignment updated"
     *     }
     *
     * and the following server response for a failed submission:
     *
     *     {
     *         "success":false, // note this is Boolean, not string
     *         "msg":"You do not have permission to perform this operation"
     *     }
     *
     * @param {Object} options The options to pass to the action (see {@link #doAction} for details).
     * @return {Ext.form.Basic} this
     */
    submit: function(options) {
        options = options || {};
        var me = this,
            action;
            
        if (options.standardSubmit || me.standardSubmit) {
            action = 'standardsubmit';
        } else {
            action = me.api ? 'directsubmit' : 'submit';
        }
            
        return me.doAction(action, options);
    },

    /**
     * Shortcut to {@link #doAction do} a {@link Ext.form.action.Load load action}.
     * @param {Object} options The options to pass to the action (see {@link #doAction} for details)
     * @return {Ext.form.Basic} this
     */
    load: function(options) {
        return this.doAction(this.api ? 'directload' : 'load', options);
    },

    /**
     * Persists the values in this form into the passed {@link Ext.data.Model} object in a beginEdit/endEdit block.
     * If the record is not specified, it will attempt to update (if it exists) the record provided to loadRecord.
     * @param {Ext.data.Model} [record] The record to edit
     * @return {Ext.form.Basic} this
     */
    updateRecord: function(record) {
        record = record || this._record;
        if (!record) {
            return this;
        }
        
        var fields = record.fields.items,
            values = this.getFieldValues(),
            obj = {},
            i = 0,
            len = fields.length,
            name;

        for (; i < len; ++i) {
            name  = fields[i].name;

            if (values.hasOwnProperty(name)) {
                obj[name] = values[name];
            }
        }

        record.beginEdit();
        record.set(obj);
        record.endEdit();

        return this;
    },

    /**
     * Loads an {@link Ext.data.Model} into this form by calling {@link #setValues} with the
     * {@link Ext.data.Model#raw record data}.
     * See also {@link #trackResetOnLoad}.
     * @param {Ext.data.Model} record The record to load
     * @return {Ext.form.Basic} this
     */
    loadRecord: function(record) {
        this._record = record;
        return this.setValues(record.getData());
    },

    /**
     * Returns the last Ext.data.Model instance that was loaded via {@link #loadRecord}
     * @return {Ext.data.Model} The record
     */
    getRecord: function() {
        return this._record;
    },

    /**
     * @private
     * Called before an action is performed via {@link #doAction}.
     * @param {Ext.form.action.Action} action The Action instance that was invoked
     */
    beforeAction: function(action) {
        var me = this,
            waitMsg = action.waitMsg,
            maskCls = Ext.baseCSSPrefix + 'mask-loading',
            fields  = me.getFields().items,
            f,
            fLen    = fields.length,
            field, waitMsgTarget;

        // Call HtmlEditor's syncValue before actions
        for (f = 0; f < fLen; f++) {
            field = fields[f];

            if (field.isFormField && field.syncValue) {
                field.syncValue();
            }
        }

        if (waitMsg) {
            waitMsgTarget = me.waitMsgTarget;
            if (waitMsgTarget === true) {
                me.owner.el.mask(waitMsg, maskCls);
            } else if (waitMsgTarget) {
                waitMsgTarget = me.waitMsgTarget = Ext.get(waitMsgTarget);
                waitMsgTarget.mask(waitMsg, maskCls);
            } else {
                me.floatingAncestor = me.owner.up('[floating]');

                // https://sencha.jira.com/browse/EXTJSIV-6397
                // When the "wait" MessageBox is hidden, the ZIndexManager activates the previous
                // topmost floating item which would be any Window housing this form.
                // That kicks off a delayed focus call on that Window.
                // So if any form post submit processing displayed a MessageBox, that gets
                // stomped on.
                // The solution is to not move focus at all during this process.
                if (me.floatingAncestor) {
                    me.savePreventFocusOnActivate = me.floatingAncestor.preventFocusOnActivate;
                    me.floatingAncestor.preventFocusOnActivate = true;
                }
                Ext.MessageBox.wait(waitMsg, action.waitTitle || me.waitTitle);
            }
        }
    },

    /**
     * @private
     * Called after an action is performed via {@link #doAction}.
     * @param {Ext.form.action.Action} action The Action instance that was invoked
     * @param {Boolean} success True if the action completed successfully, false, otherwise.
     */
    afterAction: function(action, success) {
        var me = this;
        if (action.waitMsg) {
            var messageBox = Ext.MessageBox,
                waitMsgTarget = me.waitMsgTarget;
            if (waitMsgTarget === true) {
                me.owner.el.unmask();
            } else if (waitMsgTarget) {
                waitMsgTarget.unmask();
            } else {
                messageBox.hide();
            }
        }
        // Restore setting of any floating ancestor which was manipulated in beforeAction
        if (me.floatingAncestor) {
            me.floatingAncestor.preventFocusOnActivate = me.savePreventFocusOnActivate;
        }
        if (success) {
            if (action.reset) {
                me.reset();
            }
            Ext.callback(action.success, action.scope || action, [me, action]);
            me.fireEvent('actioncomplete', me, action);
        } else {
            Ext.callback(action.failure, action.scope || action, [me, action]);
            me.fireEvent('actionfailed', me, action);
        }
    },


    /**
     * Find a specific {@link Ext.form.field.Field} in this form by id or name.
     * @param {String} id The value to search for (specify either a {@link Ext.Component#id id} or
     * {@link Ext.form.field.Field#getName name or hiddenName}).
     * @return {Ext.form.field.Field} The first matching field, or `null` if none was found.
     */
    findField: function(id) {
        return this.getFields().findBy(function(f) {
            return f.id === id || f.getName() === id;
        });
    },


    /**
     * Mark fields in this form invalid in bulk.
     * @param {Object/Object[]/Ext.data.Errors} errors
     * Either an array in the form `[{id:'fieldId', msg:'The message'}, ...]`,
     * an object hash of `{id: msg, id2: msg2}`, or a {@link Ext.data.Errors} object.
     * @return {Ext.form.Basic} this
     */
    markInvalid: function(errors) {
        var me = this,
            e, eLen, error, value,
            key;

        function mark(fieldId, msg) {
            var field = me.findField(fieldId);
            if (field) {
                field.markInvalid(msg);
            }
        }

        if (Ext.isArray(errors)) {
            eLen = errors.length;

            for (e = 0; e < eLen; e++) {
                error = errors[e];
                mark(error.id, error.msg);
            }
        } else if (errors instanceof Ext.data.Errors) {
            eLen  = errors.items.length;
            for (e = 0; e < eLen; e++) {
                error = errors.items[e];

                mark(error.field, error.message);
            }
        } else {
            for (key in errors) {
                if (errors.hasOwnProperty(key)) {
                    value = errors[key];
                    mark(key, value, errors);
                }
            }
        }
        return this;
    },

    /**
     * Set values for fields in this form in bulk.
     *
     * @param {Object/Object[]} values Either an array in the form:
     *
     *     [{id:'clientName', value:'Fred. Olsen Lines'},
     *      {id:'portOfLoading', value:'FXT'},
     *      {id:'portOfDischarge', value:'OSL'} ]
     *
     * or an object hash of the form:
     *
     *     {
     *         clientName: 'Fred. Olsen Lines',
     *         portOfLoading: 'FXT',
     *         portOfDischarge: 'OSL'
     *     }
     *
     * @return {Ext.form.Basic} this
     */
    setValues: function(values) {
        var me = this,
            v, vLen, val, field;

        function setVal(fieldId, val) {
            var field = me.findField(fieldId);
            if (field) {
                field.setValue(val);
                if (me.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            }
        }

        // Suspend here because setting the value on a field could trigger
        // a layout, for example if an error gets set, or it's a display field
        Ext.suspendLayouts();
        if (Ext.isArray(values)) {
            // array of objects
            vLen = values.length;

            for (v = 0; v < vLen; v++) {
                val = values[v];

                setVal(val.id, val.value);
            }
        } else {
            // object hash
            Ext.iterate(values, setVal);
        }
        Ext.resumeLayouts(true);
        return this;
    },

    /**
     * Retrieves the fields in the form as a set of key/value pairs, using their
     * {@link Ext.form.field.Field#getSubmitData getSubmitData()} method to collect the values.
     * If multiple fields return values under the same name those values will be combined into an Array.
     * This is similar to {@link Ext.form.Basic#getFieldValues getFieldValues} except that this method
     * collects only String values for submission, while getFieldValues collects type-specific data
     * values (e.g. Date objects for date fields.)
     *
     * @param {Boolean} [asString=false] If true, will return the key/value collection as a single
     * URL-encoded param string.
     * @param {Boolean} [dirtyOnly=false] If true, only fields that are dirty will be included in the result.
     * @param {Boolean} [includeEmptyText=false] If true, the configured emptyText of empty fields will be used.
     * @param {Boolean} [useDataValues=false] If true, the {@link Ext.form.field.Field#getModelData getModelData}
     * method is used to retrieve values from fields, otherwise the {@link Ext.form.field.Field#getSubmitData getSubmitData}
     * method is used.
     * @return {String/Object}
     */
    getValues: function(asString, dirtyOnly, includeEmptyText, useDataValues) {
        var values  = {},
            fields  = this.getFields().items,
            f,
            fLen    = fields.length,
            isArray = Ext.isArray,
            field, data, val, bucket, name;

        for (f = 0; f < fLen; f++) {
            field = fields[f];

            if (!dirtyOnly || field.isDirty()) {
                data = field[useDataValues ? 'getModelData' : 'getSubmitData'](includeEmptyText);

                if (Ext.isObject(data)) {
                    for (name in data) {
                        if (data.hasOwnProperty(name)) {
                            val = data[name];

                            if (includeEmptyText && val === '') {
                                val = field.emptyText || '';
                            }

                            if (values.hasOwnProperty(name)) {
                                bucket = values[name];

                                if (!isArray(bucket)) {
                                    bucket = values[name] = [bucket];
                                }

                                if (isArray(val)) {
                                    values[name] = bucket.concat(val);
                                } else {
                                    bucket.push(val);
                                }
                            } else {
                                values[name] = val;
                            }
                        }
                    }
                }
            }
        }

        if (asString) {
            values = Ext.Object.toQueryString(values);
        }
        return values;
    },

    /**
     * Retrieves the fields in the form as a set of key/value pairs, using their
     * {@link Ext.form.field.Field#getModelData getModelData()} method to collect the values.
     * If multiple fields return values under the same name those values will be combined into an Array.
     * This is similar to {@link #getValues} except that this method collects type-specific data values
     * (e.g. Date objects for date fields) while getValues returns only String values for submission.
     *
     * @param {Boolean} [dirtyOnly=false] If true, only fields that are dirty will be included in the result.
     * @return {Object}
     */
    getFieldValues: function(dirtyOnly) {
        return this.getValues(false, dirtyOnly, false, true);
    },

    /**
     * Clears all invalid field messages in this form.
     * @return {Ext.form.Basic} this
     */
    clearInvalid: function() {
        Ext.suspendLayouts();

        var me     = this,
            fields = me.getFields().items,
            f,
            fLen   = fields.length;

        for (f = 0; f < fLen; f++) {
            fields[f].clearInvalid();
        }

        Ext.resumeLayouts(true);
        return me;
    },

    /**
     * Resets all fields in this form. By default, any record bound by {@link #loadRecord}
     * will be retained.
     * @param {Boolean} [resetRecord=false] True to unbind any record set
     * by {@link #loadRecord}
     * @return {Ext.form.Basic} this
     */
    reset: function(resetRecord) {
        Ext.suspendLayouts();

        var me     = this,
            fields = me.getFields().items,
            f,
            fLen   = fields.length;

        for (f = 0; f < fLen; f++) {
            fields[f].reset();
        }

        Ext.resumeLayouts(true);
        
        if (resetRecord === true) {
            delete me._record;
        }
        return me;
    },

    /**
     * Calls {@link Ext#apply Ext.apply} for all fields in this form with the passed object.
     * @param {Object} obj The object to be applied
     * @return {Ext.form.Basic} this
     */
    applyToFields: function(obj) {
        var fields = this.getFields().items,
            f,
            fLen   = fields.length;

        for (f = 0; f < fLen; f++) {
            Ext.apply(fields[f], obj);
        }

        return this;
    },

    /**
     * Calls {@link Ext#applyIf Ext.applyIf} for all field in this form with the passed object.
     * @param {Object} obj The object to be applied
     * @return {Ext.form.Basic} this
     */
    applyIfToFields: function(obj) {
        var fields = this.getFields().items,
            f,
            fLen   = fields.length;

        for (f = 0; f < fLen; f++) {
            Ext.applyIf(fields[f], obj);
        }

        return this;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @docauthor Jason Johnston <jason@sencha.com>
 * 
 * FormPanel provides a standard container for forms. It is essentially a standard {@link Ext.panel.Panel} which
 * automatically creates a {@link Ext.form.Basic BasicForm} for managing any {@link Ext.form.field.Field}
 * objects that are added as descendants of the panel. It also includes conveniences for configuring and
 * working with the BasicForm and the collection of Fields.
 * 
 * # Layout
 * 
 * By default, FormPanel is configured with `{@link Ext.layout.container.Anchor layout:'anchor'}` for
 * the layout of its immediate child items. This can be changed to any of the supported container layouts.
 * The layout of sub-containers is configured in {@link Ext.container.Container#layout the standard way}.
 * 
 * # BasicForm
 * 
 * Although **not listed** as configuration options of FormPanel, the FormPanel class accepts all
 * of the config options supported by the {@link Ext.form.Basic} class, and will pass them along to
 * the internal BasicForm when it is created.
 * 
 * The following events fired by the BasicForm will be re-fired by the FormPanel and can therefore be
 * listened for on the FormPanel itself:
 * 
 * - {@link Ext.form.Basic#beforeaction beforeaction}
 * - {@link Ext.form.Basic#actionfailed actionfailed}
 * - {@link Ext.form.Basic#actioncomplete actioncomplete}
 * - {@link Ext.form.Basic#validitychange validitychange}
 * - {@link Ext.form.Basic#dirtychange dirtychange}
 * 
 * # Field Defaults
 * 
 * The {@link #fieldDefaults} config option conveniently allows centralized configuration of default values
 * for all fields added as descendants of the FormPanel. Any config option recognized by implementations
 * of {@link Ext.form.Labelable} may be included in this object. See the {@link #fieldDefaults} documentation
 * for details of how the defaults are applied.
 * 
 * # Form Validation
 * 
 * With the default configuration, form fields are validated on-the-fly while the user edits their values.
 * This can be controlled on a per-field basis (or via the {@link #fieldDefaults} config) with the field
 * config properties {@link Ext.form.field.Field#validateOnChange} and {@link Ext.form.field.Base#checkChangeEvents},
 * and the FormPanel's config properties {@link #pollForChanges} and {@link #pollInterval}.
 * 
 * Any component within the FormPanel can be configured with `formBind: true`. This will cause that
 * component to be automatically disabled when the form is invalid, and enabled when it is valid. This is most
 * commonly used for Button components to prevent submitting the form in an invalid state, but can be used on
 * any component type.
 * 
 * For more information on form validation see the following:
 * 
 * - {@link Ext.form.field.Field#validateOnChange}
 * - {@link #pollForChanges} and {@link #pollInterval}
 * - {@link Ext.form.field.VTypes}
 * - {@link Ext.form.Basic#doAction BasicForm.doAction clientValidation notes}
 * 
 * # Form Submission
 * 
 * By default, Ext Forms are submitted through Ajax, using {@link Ext.form.action.Action}. See the documentation for
 * {@link Ext.form.Basic} for details.
 *
 * # Example usage
 * 
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'Simple Form',
 *         bodyPadding: 5,
 *         width: 350,
 * 
 *         // The form will submit an AJAX request to this URL when submitted
 *         url: 'save-form.php',
 * 
 *         // Fields will be arranged vertically, stretched to full width
 *         layout: 'anchor',
 *         defaults: {
 *             anchor: '100%'
 *         },
 * 
 *         // The fields
 *         defaultType: 'textfield',
 *         items: [{
 *             fieldLabel: 'First Name',
 *             name: 'first',
 *             allowBlank: false
 *         },{
 *             fieldLabel: 'Last Name',
 *             name: 'last',
 *             allowBlank: false
 *         }],
 * 
 *         // Reset and Submit buttons
 *         buttons: [{
 *             text: 'Reset',
 *             handler: function() {
 *                 this.up('form').getForm().reset();
 *             }
 *         }, {
 *             text: 'Submit',
 *             formBind: true, //only enabled once the form is valid
 *             disabled: true,
 *             handler: function() {
 *                 var form = this.up('form').getForm();
 *                 if (form.isValid()) {
 *                     form.submit({
 *                         success: function(form, action) {
 *                            Ext.Msg.alert('Success', action.result.msg);
 *                         },
 *                         failure: function(form, action) {
 *                             Ext.Msg.alert('Failed', action.result.msg);
 *                         }
 *                     });
 *                 }
 *             }
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 *
 */
Ext.define('Ext.form.Panel', {
    extend: Ext.panel.Panel ,
    mixins: {
        fieldAncestor:  Ext.form.FieldAncestor 
    },
    alias: 'widget.form',
    alternateClassName: ['Ext.FormPanel', 'Ext.form.FormPanel'],
                                                        

    /**
     * @cfg {Boolean} pollForChanges
     * If set to `true`, sets up an interval task (using the {@link #pollInterval}) in which the
     * panel's fields are repeatedly checked for changes in their values. This is in addition to the normal detection
     * each field does on its own input element, and is not needed in most cases. It does, however, provide a
     * means to absolutely guarantee detection of all changes including some edge cases in some browsers which
     * do not fire native events. Defaults to `false`.
     */

    /**
     * @cfg {Number} pollInterval
     * Interval in milliseconds at which the form's fields are checked for value changes. Only used if
     * the {@link #pollForChanges} option is set to `true`. Defaults to 500 milliseconds.
     */

    /**
     * @cfg {Ext.enums.Layout/Object} layout
     * The {@link Ext.container.Container#layout} for the form panel's immediate child items.
     */
    layout: 'anchor',

    ariaRole: 'form',
    
    basicFormConfigs: [
        'api', 
        'baseParams', 
        'errorReader', 
        'jsonSubmit',
        'method', 
        'paramOrder',
        'paramsAsHash',
        'reader',
        'standardSubmit',
        'timeout',
        'trackResetOnLoad',
        'url',
        'waitMsgTarget',
        'waitTitle'
    ],

    initComponent: function() {
        var me = this;

        if (me.frame) {
            me.border = false;
        }

        me.initFieldAncestor();
        me.callParent();

        me.relayEvents(me.form, [
            /**
             * @event beforeaction
             * @inheritdoc Ext.form.Basic#beforeaction
             */
            'beforeaction',
            /**
             * @event actionfailed
             * @inheritdoc Ext.form.Basic#actionfailed
             */
            'actionfailed',
            /**
             * @event actioncomplete
             * @inheritdoc Ext.form.Basic#actioncomplete
             */
            'actioncomplete',
            /**
             * @event validitychange
             * @inheritdoc Ext.form.Basic#validitychange
             */
            'validitychange',
            /**
             * @event dirtychange
             * @inheritdoc Ext.form.Basic#dirtychange
             */
            'dirtychange'
        ]);

        // Start polling if configured
        if (me.pollForChanges) {
            me.startPolling(me.pollInterval || 500);
        }
    },

    initItems: function() {
        // Create the BasicForm
        this.callParent();
        this.initMonitor();
        this.form = this.createForm();
    },

    // Initialize the BasicForm after all layouts have been completed.
    afterFirstLayout: function() {
        this.callParent(arguments);
        this.form.initialize();
    },

    /**
     * @private
     */
    createForm: function() {
        var cfg = {},
            props = this.basicFormConfigs,
            len = props.length,
            i = 0,
            prop;
            
        for (; i < len; ++i) {
            prop = props[i];
            cfg[prop] = this[prop];
        }
        return new Ext.form.Basic(this, cfg);
    },

    /**
     * Provides access to the {@link Ext.form.Basic Form} which this Panel contains.
     * @return {Ext.form.Basic} The {@link Ext.form.Basic Form} which this Panel contains.
     */
    getForm: function() {
        return this.form;
    },

    /**
     * Loads an {@link Ext.data.Model} into this form (internally just calls {@link Ext.form.Basic#loadRecord})
     * See also {@link Ext.form.Basic#trackResetOnLoad trackResetOnLoad}.
     * @param {Ext.data.Model} record The record to load
     * @return {Ext.form.Basic} The Ext.form.Basic attached to this FormPanel
     */
    loadRecord: function(record) {
        return this.getForm().loadRecord(record);
    },

    /**
     * Returns the currently loaded Ext.data.Model instance if one was loaded via {@link #loadRecord}.
     * @return {Ext.data.Model} The loaded instance
     */
    getRecord: function() {
        return this.getForm().getRecord();
    },
    
    /**
     * Persists the values in this form into the passed {@link Ext.data.Model} object in a beginEdit/endEdit block.
     * If the record is not specified, it will attempt to update (if it exists) the record provided to {@link #loadRecord}.
     * @param {Ext.data.Model} [record] The record to edit
     * @return {Ext.form.Basic} The Ext.form.Basic attached to this FormPanel
     */
    updateRecord: function(record) {
        return this.getForm().updateRecord(record);
    },

    /**
     * Convenience function for fetching the current value of each field in the form. This is the same as calling
     * {@link Ext.form.Basic#getValues this.getForm().getValues()}.
     *
     * @inheritdoc Ext.form.Basic#getValues
     */
    getValues: function(asString, dirtyOnly, includeEmptyText, useDataValues) {
        return this.getForm().getValues(asString, dirtyOnly, includeEmptyText, useDataValues);
    },
    
    /**
     * Convenience function to check if the form has any dirty fields. This is the same as calling
     * {@link Ext.form.Basic#isDirty this.getForm().isDirty()}.
     *
     * @inheritdoc Ext.form.Basic#isDirty
     */
    isDirty: function () {
        return this.form.isDirty();
    },
    
    /**
     * Convenience function to check if the form has all valid fields. This is the same as calling
     * {@link Ext.form.Basic#isValid this.getForm().isValid()}.
     *
     * @inheritdoc Ext.form.Basic#isValid
     */
    isValid: function () {
       return this.form.isValid();
    },
    
    /**
     * Convenience function to check if the form has any invalid fields. This is the same as calling
     * {@link Ext.form.Basic#hasInvalidField this.getForm().hasInvalidField()}.
     *
     * @inheritdoc Ext.form.Basic#hasInvalidField
     */
    hasInvalidField: function () {
        return this.form.hasInvalidField();
    },

    beforeDestroy: function() {
        this.stopPolling();
        this.form.destroy();
        this.callParent();
    },

    /**
     * This is a proxy for the underlying BasicForm's {@link Ext.form.Basic#load} call.
     * @param {Object} options The options to pass to the action (see {@link Ext.form.Basic#load} and
     * {@link Ext.form.Basic#doAction} for details)
     */
    load: function(options) {
        this.form.load(options);
    },

    /**
     * This is a proxy for the underlying BasicForm's {@link Ext.form.Basic#submit} call.
     * @param {Object} options The options to pass to the action (see {@link Ext.form.Basic#submit} and
     * {@link Ext.form.Basic#doAction} for details)
     */
    submit: function(options) {
        this.form.submit(options);
    },

    /**
     * Start an interval task to continuously poll all the fields in the form for changes in their
     * values. This is normally started automatically by setting the {@link #pollForChanges} config.
     * @param {Number} interval The interval in milliseconds at which the check should run.
     */
    startPolling: function(interval) {
        this.stopPolling();
        var task = new Ext.util.TaskRunner(interval);
        task.start({
            interval: 0,
            run: this.checkChange,
            scope: this
        });
        this.pollTask = task;
    },

    /**
     * Stop a running interval task that was started by {@link #startPolling}.
     */
    stopPolling: function() {
        var task = this.pollTask;
        if (task) {
            task.stopAll();
            delete this.pollTask;
        }
    },

    /**
     * Forces each field within the form panel to
     * {@link Ext.form.field.Field#checkChange check if its value has changed}.
     */
    checkChange: function() {
        var fields = this.form.getFields().items,
            f,
            fLen   = fields.length;

        for (f = 0; f < fLen; f++) {
            fields[f].checkChange();
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Provides a convenient wrapper for TextFields that adds a clickable trigger button (looks like a combobox by default).
 * The trigger has no default action, so you must assign a function to implement the trigger click handler by overriding
 * {@link #onTriggerClick}. You can create a Trigger field directly, as it renders exactly like a combobox for which you
 * can provide a custom implementation.
 *
 * For example:
 *
 *     @example
 *     Ext.define('Ext.ux.CustomTrigger', {
 *         extend: 'Ext.form.field.Trigger',
 *         alias: 'widget.customtrigger',
 *
 *         // override onTriggerClick
 *         onTriggerClick: function() {
 *             Ext.Msg.alert('Status', 'You clicked my trigger!');
 *         }
 *     });
 *
 *     Ext.create('Ext.form.FormPanel', {
 *         title: 'Form with TriggerField',
 *         bodyPadding: 5,
 *         width: 350,
 *         renderTo: Ext.getBody(),
 *         items:[{
 *             xtype: 'customtrigger',
 *             fieldLabel: 'Sample Trigger',
 *             emptyText: 'click the trigger'
 *         }]
 *     });
 *
 * However, in general you will most likely want to use Trigger as the base class for a reusable component.
 * {@link Ext.form.field.Date} and {@link Ext.form.field.ComboBox} are perfect examples of this.
 */
Ext.define('Ext.form.field.Trigger', {
    extend: Ext.form.field.Text ,
    alias: ['widget.triggerfield', 'widget.trigger'],
                                                                                                 
    alternateClassName: ['Ext.form.TriggerField', 'Ext.form.TwinTriggerField', 'Ext.form.Trigger'],

    childEls: [
        /**
         * @property {Ext.CompositeElement} triggerEl
         * A composite of all the trigger button elements. Only set after the field has been rendered.
         */
        { name: 'triggerCell', select: '.' + Ext.baseCSSPrefix + 'trigger-cell' },
        { name: 'triggerEl', select: '.' + Ext.baseCSSPrefix + 'form-trigger' },

        /**
         * @property {Ext.Element} triggerWrap
         * A reference to the `TABLE` element which encapsulates the input field and all trigger button(s). Only set after the field has been rendered.
         */
        'triggerWrap',

        /**
         * @property {Ext.Element} inputCell
         * A reference to the `TD` element wrapping the input element. Only set after the field has been rendered.
         */
        'inputCell'
    ],

    /**
     * @cfg {String} triggerCls
     * An additional CSS class used to style the trigger button. The trigger will always get the {@link #triggerBaseCls}
     * by default and triggerCls will be **appended** if specified.
     */

    /**
     * @cfg
     * The base CSS class that is always added to the trigger button. The {@link #triggerCls} will be appended in
     * addition to this class.
     */
    triggerBaseCls: Ext.baseCSSPrefix + 'form-trigger',

    /**
     * @cfg
     * The CSS class that is added to the div wrapping the trigger button(s).
     */
    triggerWrapCls: Ext.baseCSSPrefix + 'form-trigger-wrap',

    /**
     * @cfg
     * The CSS class that is added to the text field when component is read-only or not editable.
     */
    triggerNoEditCls: Ext.baseCSSPrefix + 'trigger-noedit',

    /**
     * @cfg {Boolean} hideTrigger
     * true to hide the trigger element and display only the base text field
     */
    hideTrigger: false,

    /**
     * @cfg {Boolean} editable
     * false to prevent the user from typing text directly into the field; the field can only have its value set via an
     * action invoked by the trigger.
     */
    editable: true,

    /**
     * @cfg {Boolean} readOnly
     * true to prevent the user from changing the field, and hides the trigger. Supercedes the editable and hideTrigger
     * options if the value is true.
     */
    readOnly: false,

    /**
     * @cfg {Boolean} [selectOnFocus=false]
     * true to select any existing text in the field immediately on focus. Only applies when
     * {@link #editable editable} = true
     */

    /**
     * @cfg {Boolean} repeatTriggerClick
     * true to attach a {@link Ext.util.ClickRepeater click repeater} to the trigger.
     */
    repeatTriggerClick: false,


    /**
     * @method autoSize
     * @private
     */
    autoSize: Ext.emptyFn,
    // @private
    monitorTab: true,
    // @private
    mimicing: false,
    // @private
    triggerIndexRe: /trigger-index-(\d+)/,
    
    extraTriggerCls: '',

    componentLayout: 'triggerfield',

    initComponent: function() {
        this.wrapFocusCls = this.triggerWrapCls + '-focus';
        this.callParent(arguments);
    },

    getSubTplMarkup: function(values) {
        var me = this,
            childElCls = values.childElCls, // either '' or ' x-foo'
            field = me.callParent(arguments);

        return '<table id="' + me.id + '-triggerWrap" class="' + Ext.baseCSSPrefix + 'form-trigger-wrap' + childElCls + '" cellpadding="0" cellspacing="0"><tbody><tr>' +
            '<td id="' + me.id + '-inputCell" class="' + Ext.baseCSSPrefix + 'form-trigger-input-cell' + childElCls + '">' + field + '</td>' +
            me.getTriggerMarkup() +
            '</tr></tbody></table>';
    },
    
    getSubTplData: function(){
        var me = this,
            data = me.callParent(),
            readOnly = me.readOnly === true,
            editable = me.editable !== false;
        
        return Ext.apply(data, {
            editableCls: (readOnly || !editable) ? ' ' + me.triggerNoEditCls : '',
            readOnly: !editable || readOnly
        });  
    },

    getLabelableRenderData: function() {
        var me = this,
            triggerWrapCls = me.triggerWrapCls,
            result = me.callParent(arguments);

        return Ext.applyIf(result, {
            triggerWrapCls: triggerWrapCls,
            triggerMarkup: me.getTriggerMarkup()
        });
    },

    getTriggerMarkup: function() {
        var me = this,
            i = 0,
            hideTrigger = (me.readOnly || me.hideTrigger),
            triggerCls,
            triggerBaseCls = me.triggerBaseCls,
            triggerConfigs = [],
            unselectableCls = Ext.dom.Element.unselectableCls,
            style = 'width:' + me.triggerWidth + 'px;' + (hideTrigger ? 'display:none;' : ''),
            cls = me.extraTriggerCls + ' ' + Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls;

        // TODO this trigger<n>Cls API design doesn't feel clean, especially where it butts up against the
        // single triggerCls config. Should rethink this, perhaps something more structured like a list of
        // trigger config objects that hold cls, handler, etc.
        // triggerCls is a synonym for trigger1Cls, so copy it.
        if (!me.trigger1Cls) {
            me.trigger1Cls = me.triggerCls;
        }

        // Create as many trigger elements as we have trigger<n>Cls configs, but always at least one
        for (i = 0; (triggerCls = me['trigger' + (i + 1) + 'Cls']) || i < 1; i++) {
            triggerConfigs.push({
                tag: 'td',
                valign: 'top',
                cls: cls,
                style: style,
                cn: {
                    cls: [Ext.baseCSSPrefix + 'trigger-index-' + i, triggerBaseCls, triggerCls].join(' '),
                    role: 'button'
                }
            });
        }
        triggerConfigs[0].cn.cls += ' ' + triggerBaseCls + '-first';

        return Ext.DomHelper.markup(triggerConfigs);
    },
    
    disableCheck: function() {
        return !this.disabled;    
    },

    // @private
    beforeRender: function() {
        var me = this,
            triggerBaseCls = me.triggerBaseCls,
            tempEl;
            
        /**
         * @property {Number} triggerWidth
         * Width of the trigger element. Unless set explicitly, it will be
         * automatically calculated through creating a temporary element
         * on page. (That will be done just once per app run.)
         * @private
         */
        if (!me.triggerWidth) {
            tempEl = Ext.getBody().createChild({
                style: 'position: absolute;', 
                cls: Ext.baseCSSPrefix + 'form-trigger'
            });
            Ext.form.field.Trigger.prototype.triggerWidth = tempEl.getWidth();
            tempEl.remove();
        }

        me.callParent();

        if (triggerBaseCls != Ext.baseCSSPrefix + 'form-trigger') {
            // we may need to change the selectors by which we extract trigger elements if is triggerBaseCls isn't the value we
            // stuck in childEls
            me.addChildEls({ name: 'triggerEl', select: '.' + triggerBaseCls });
        }

        // these start correct in the fieldSubTpl:
        me.lastTriggerStateFlags = me.getTriggerStateFlags();
    },

    onRender: function() {
        var me = this;

        me.callParent(arguments);

        me.doc = Ext.getDoc();
        me.initTrigger();
    },

    /**
     * Get the total width of the trigger button area.
     * @return {Number} The total trigger width
     */
    getTriggerWidth: function() {
        var me = this,
            totalTriggerWidth = 0;

        if (me.triggerWrap && !me.hideTrigger && !me.readOnly) {
            totalTriggerWidth = me.triggerEl.getCount() * me.triggerWidth;
        }
        return totalTriggerWidth;
    },

    setHideTrigger: function(hideTrigger) {
        if (hideTrigger != this.hideTrigger) {
            this.hideTrigger = hideTrigger;
            this.updateLayout();
        }
    },

    /**
     * Sets the editable state of this field. This method is the runtime equivalent of setting the 'editable' config
     * option at config time.
     * @param {Boolean} editable True to allow the user to directly edit the field text. If false is passed, the user
     * will only be able to modify the field using the trigger. Will also add a click event to the text field which
     * will call the trigger. 
     */
    setEditable: function(editable) {
        if (editable != this.editable) {
            this.editable = editable;
            this.updateLayout();
        }
    },

    /**
     * Sets the read-only state of this field. This method is the runtime equivalent of setting the 'readOnly' config
     * option at config time.
     * @param {Boolean} readOnly True to prevent the user changing the field and explicitly hide the trigger. Setting
     * this to true will supercede settings editable and hideTrigger. Setting this to false will defer back to editable
     * and hideTrigger.
     */
    setReadOnly: function(readOnly) {
        var me = this,
            old = me.readOnly;
            
        me.callParent(arguments);
        if (readOnly != old) {
            me.updateLayout();
        }
    },

    // @private
    initTrigger: function() {
        var me = this,
            triggerWrap = me.triggerWrap,
            triggerEl = me.triggerEl,
            disableCheck = me.disableCheck,
            els, eLen, el, e, idx;

        if (me.repeatTriggerClick) {
            me.triggerRepeater = new Ext.util.ClickRepeater(triggerWrap, {
                preventDefault: true,
                handler: me.onTriggerWrapClick,
                listeners: {
                    mouseup: me.onTriggerWrapMouseup,
                    scope: me
                },
                scope: me
            });
        } else {
            me.mon(triggerWrap, {
                click: me.onTriggerWrapClick,
                mouseup: me.onTriggerWrapMouseup,
                scope: me
            });
        }

        triggerEl.setVisibilityMode(Ext.Element.DISPLAY);
        triggerEl.addClsOnOver(me.triggerBaseCls + '-over', disableCheck, me);

        els  = triggerEl.elements;
        eLen = els.length;

        for (e = 0; e < eLen; e++) {
            el = els[e];
            idx = e+1;
            el.addClsOnOver(me['trigger' + (idx) + 'Cls'] + '-over', disableCheck, me);
            el.addClsOnClick(me['trigger' + (idx) + 'Cls'] + '-click', disableCheck, me);
        }

        triggerEl.addClsOnClick(me.triggerBaseCls + '-click', disableCheck, me);

    },

    // @private
    onDestroy: function() {
        var me = this;
        Ext.destroyMembers(me, 'triggerRepeater', 'triggerWrap', 'triggerEl');
        delete me.doc;
        me.callParent();
    },

    // @private
    onFocus: function() {
        var me = this;
        me.callParent(arguments);
        if (!me.mimicing) {
            me.bodyEl.addCls(me.wrapFocusCls);
            me.mimicing = true;
            me.mon(me.doc, 'mousedown', me.mimicBlur, me, {
                delay: 10
            });
            if (me.monitorTab) {
                me.on('specialkey', me.checkTab, me);
            }
        }
    },

    // @private
    checkTab: function(me, e) {
        if (!this.ignoreMonitorTab && e.getKey() == e.TAB) {
            this.triggerBlur();
        }
    },

    /**
     * Returns a set of flags that describe the trigger state. These are just used to easily
     * determine if the DOM is out-of-sync with the component's properties.
     * @private
     */
    getTriggerStateFlags: function () {
        var me = this,
            state = 0;

        if (me.readOnly) {
            state += 1;
        }
        if (me.editable) {
            state += 2;
        }
        if (me.hideTrigger) {
            state += 4;
        }
        return state;
    },

    /**
     * @private
     * The default blur handling must not occur for a TriggerField, implementing this template method as emptyFn disables that.
     * Instead the tab key is monitored, and the superclass's onBlur is called when tab is detected
     */
    onBlur: Ext.emptyFn,

    // @private
    mimicBlur: function(e) {
        if (!this.isDestroyed && !this.bodyEl.contains(e.target) && this.validateBlur(e)) {
            this.triggerBlur(e);
        }
    },

    // @private
    triggerBlur: function(e) {
        var me = this;
        me.mimicing = false;
        me.mun(me.doc, 'mousedown', me.mimicBlur, me);
        if (me.monitorTab && me.inputEl) {
            me.un('specialkey', me.checkTab, me);
        }
        Ext.form.field.Trigger.superclass.onBlur.call(me, e);
        if (me.bodyEl) {
            me.bodyEl.removeCls(me.wrapFocusCls);
        }
    },

    // @private
    // This should be overridden by any subclass that needs to check whether or not the field can be blurred.
    validateBlur: function(e) {
        return true;
    },

    // @private
    // process clicks upon triggers.
    // determine which trigger index, and dispatch to the appropriate click handler
    onTriggerWrapClick: function() {
        var me = this,
            targetEl, match,
            triggerClickMethod,
            event;

        event = arguments[me.triggerRepeater ? 1 : 0];
        if (event && !me.readOnly && !me.disabled) {
                targetEl = event.getTarget('.' + me.triggerBaseCls, null);
                match = targetEl && targetEl.className.match(me.triggerIndexRe);

            if (match) {
                triggerClickMethod = me['onTrigger' + (parseInt(match[1], 10) + 1) + 'Click'] || me.onTriggerClick;
                if (triggerClickMethod) {
                    triggerClickMethod.call(me, event);
                }
            }
        }
    },

    // @private
    // Handle trigger mouse up gesture. To be implemented in subclasses.
    // Currently the Spinner subclass refocuses the input element upon end of spin.
    onTriggerWrapMouseup: Ext.emptyFn,

    /**
     * @method onTriggerClick
     * @protected
     * The function that should handle the trigger's click event. This method does nothing by default until overridden
     * by an implementing function. See Ext.form.field.ComboBox and Ext.form.field.Date for sample implementations.
     * @param {Ext.EventObject} e
     */
    onTriggerClick: Ext.emptyFn

    /**
     * @cfg {Boolean} grow
     * @private
     */
    /**
     * @cfg {Number} growMin
     * @private
     */
    /**
     * @cfg {Number} growMax
     * @private
     */
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * An abstract class for fields that have a single trigger which opens a "picker" popup below the field, e.g. a combobox
 * menu list or a date picker. It provides a base implementation for toggling the picker's visibility when the trigger
 * is clicked, as well as keyboard navigation and some basic events. Sizing and alignment of the picker can be
 * controlled via the {@link #matchFieldWidth} and {@link #pickerAlign}/{@link #pickerOffset} config properties
 * respectively.
 *
 * You would not normally use this class directly, but instead use it as the parent class for a specific picker field
 * implementation. Subclasses must implement the {@link #createPicker} method to create a picker component appropriate
 * for the field.
 */
Ext.define('Ext.form.field.Picker', {
    extend:  Ext.form.field.Trigger ,
    alias: 'widget.pickerfield',
    alternateClassName: 'Ext.form.Picker',
                                  

    /**
     * @cfg {Boolean} matchFieldWidth
     * Whether the picker dropdown's width should be explicitly set to match the width of the field. Defaults to true.
     */
    matchFieldWidth: true,

    /**
     * @cfg {String} pickerAlign
     * The {@link Ext.util.Positionable#alignTo alignment position} with which to align the picker. Defaults to "tl-bl?"
     */
    pickerAlign: 'tl-bl?',

    /**
     * @cfg {Number[]} pickerOffset
     * An offset [x,y] to use in addition to the {@link #pickerAlign} when positioning the picker.
     * Defaults to undefined.
     */

    /**
     * @cfg {String} [openCls='x-pickerfield-open']
     * A class to be added to the field's {@link #bodyEl} element when the picker is opened.
     */
    openCls: Ext.baseCSSPrefix + 'pickerfield-open',

    /**
     * @property {Boolean} isExpanded
     * True if the picker is currently expanded, false if not.
     */

    /**
     * @cfg {Boolean} editable
     * False to prevent the user from typing text directly into the field; the field can only have its value set via
     * selecting a value from the picker. In this state, the picker can also be opened by clicking directly on the input
     * field itself.
     */
    editable: true,


    initComponent: function() {
        this.callParent();

        // Custom events
        this.addEvents(
            /**
             * @event expand
             * Fires when the field's picker is expanded.
             * @param {Ext.form.field.Picker} field This field instance
             */
            'expand',
            /**
             * @event collapse
             * Fires when the field's picker is collapsed.
             * @param {Ext.form.field.Picker} field This field instance
             */
            'collapse',
            /**
             * @event select
             * Fires when a value is selected via the picker.
             * @param {Ext.form.field.Picker} field This field instance
             * @param {Object} value The value that was selected. The exact type of this value is dependent on
             * the individual field and picker implementations.
             */
            'select'
        );
    },


    initEvents: function() {
        var me = this;
        me.callParent();

        // Add handlers for keys to expand/collapse the picker
        me.keyNav = new Ext.util.KeyNav(me.inputEl, {
            down: me.onDownArrow,
            esc: {
                handler: me.onEsc,
                scope: me,
                defaultEventAction: false
            },
            scope: me,
            forceKeyDown: true
        });

        // Non-editable allows opening the picker by clicking the field
        if (!me.editable) {
            me.mon(me.inputEl, 'click', me.onTriggerClick, me);
        }

        // Disable native browser autocomplete
        if (Ext.isGecko) {
            me.inputEl.dom.setAttribute('autocomplete', 'off');
        }
    },

    // private
    onEsc: function(e) {
        if (Ext.isIE) {
            // Stop the esc key from "restoring" the previous value in IE
            // For example, type "foo". Highlight all the text, hit backspace.
            // Hit esc, "foo" will be restored. This behaviour doesn't occur
            // in any other browsers
            e.preventDefault();
        }
        
        if (this.isExpanded) {
            this.collapse();
            e.stopEvent();
        }
    },

    onDownArrow: function(e) {
        if (!this.isExpanded) {
            // Don't call expand() directly as there may be additional processing involved before
            // expanding, e.g. in the case of a ComboBox query.
            this.onTriggerClick();
        }
    },

    /**
     * Expands this field's picker dropdown.
     */
    expand: function() {
        var me = this,
            bodyEl, picker, collapseIf;

        if (me.rendered && !me.isExpanded && !me.isDestroyed) {
            me.expanding = true;
            bodyEl = me.bodyEl;
            picker = me.getPicker();
            collapseIf = me.collapseIf;

            // show the picker and set isExpanded flag
            picker.show();
            me.isExpanded = true;
            me.alignPicker();
            bodyEl.addCls(me.openCls);

            // monitor clicking and mousewheel
            me.mon(Ext.getDoc(), {
                mousewheel: collapseIf,
                mousedown: collapseIf,
                scope: me
            });
            Ext.EventManager.onWindowResize(me.alignPicker, me);
            me.fireEvent('expand', me);
            me.onExpand();
            delete me.expanding;
        }
    },

    onExpand: Ext.emptyFn,

    /**
     * Aligns the picker to the input element
     * @protected
     */
    alignPicker: function() {
        var me = this,
            picker = me.getPicker();

        if (me.isExpanded) {
            if (me.matchFieldWidth) {
                // Auto the height (it will be constrained by min and max width) unless there are no records to display.
                picker.setWidth(me.bodyEl.getWidth());
            }
            if (picker.isFloating()) {
                me.doAlign();
            }
        }
    },

    /**
     * Performs the alignment on the picker using the class defaults
     * @private
     */
    doAlign: function(){
        var me = this,
            picker = me.picker,
            aboveSfx = '-above',
            isAbove;

        // Align to the trigger wrap because the border isn't always on the input element, which
        // can cause the offset to be off
        me.picker.alignTo(me.triggerWrap, me.pickerAlign, me.pickerOffset);
        // add the {openCls}-above class if the picker was aligned above
        // the field due to hitting the bottom of the viewport
        isAbove = picker.el.getY() < me.inputEl.getY();
        me.bodyEl[isAbove ? 'addCls' : 'removeCls'](me.openCls + aboveSfx);
        picker[isAbove ? 'addCls' : 'removeCls'](picker.baseCls + aboveSfx);
    },

    /**
     * Collapses this field's picker dropdown.
     */
    collapse: function() {
        if (this.isExpanded && !this.isDestroyed) {
            var me = this,
                openCls = me.openCls,
                picker = me.picker,
                doc = Ext.getDoc(),
                collapseIf = me.collapseIf,
                aboveSfx = '-above';

            // hide the picker and set isExpanded flag
            picker.hide();
            me.isExpanded = false;

            // remove the openCls
            me.bodyEl.removeCls([openCls, openCls + aboveSfx]);
            picker.el.removeCls(picker.baseCls + aboveSfx);

            // remove event listeners
            doc.un('mousewheel', collapseIf, me);
            doc.un('mousedown', collapseIf, me);
            Ext.EventManager.removeResizeListener(me.alignPicker, me);
            me.fireEvent('collapse', me);
            me.onCollapse();
        }
    },

    onCollapse: Ext.emptyFn,


    /**
     * @private
     * Runs on mousewheel and mousedown of doc to check to see if we should collapse the picker
     */
    collapseIf: function(e) {
        var me = this;

        if (!me.isDestroyed && !e.within(me.bodyEl, false, true) && !e.within(me.picker.el, false, true) && !me.isEventWithinPickerLoadMask(e)) {
            me.collapse();
        }
    },

    /**
     * Returns a reference to the picker component for this field, creating it if necessary by
     * calling {@link #createPicker}.
     * @return {Ext.Component} The picker component
     */
    getPicker: function() {
        var me = this;
        return me.picker || (me.picker = me.createPicker());
    },

    /**
     * @method
     * Creates and returns the component to be used as this field's picker. Must be implemented by subclasses of Picker.
     * The current field should also be passed as a configuration option to the picker component as the pickerField
     * property.
     */
    createPicker: Ext.emptyFn,

    /**
     * Handles the trigger click; by default toggles between expanding and collapsing the picker component.
     * @protected
     */
    onTriggerClick: function() {
        var me = this;
        if (!me.readOnly && !me.disabled) {
            if (me.isExpanded) {
                me.collapse();
            } else {
                me.expand();
            }
            me.inputEl.focus();
        }
    },
    
    triggerBlur: function() {
        var picker = this.picker;
            
        this.callParent(arguments);
        if (picker && picker.isVisible()) {
            picker.hide();
        }
    },

    mimicBlur: function(e) {
        var me = this,
            picker = me.picker;
        // ignore mousedown events within the picker element
        if (!picker || !e.within(picker.el, false, true) && !me.isEventWithinPickerLoadMask(e)) {
            me.callParent(arguments);
        }
    },

    onDestroy : function(){
        var me = this,
            picker = me.picker;

        Ext.EventManager.removeResizeListener(me.alignPicker, me);
        Ext.destroy(me.keyNav);
        if (picker) {
            delete picker.pickerField;
            picker.destroy();
        }
        me.callParent();
    },

    /**
     * returns true if the picker has a load mask and the passed event is within the load mask
     * @private
     * @param {Ext.EventObject} e
     * @return {Boolean}
     */
    isEventWithinPickerLoadMask: function(e) {
        var loadMask = this.picker.loadMask;

        return loadMask ? e.within(loadMask.maskEl, false, true) || e.within(loadMask.el, false, true) : false;
    }

});


/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Component layout for {@link Ext.view.BoundList}.
 * @private
 */
Ext.define('Ext.layout.component.BoundList', {
    extend:  Ext.layout.component.Auto ,
    alias: 'layout.boundlist',

    type: 'component',
    
    beginLayout: function(ownerContext) {
        var me = this,
            owner = me.owner,
            toolbar = owner.pagingToolbar;

        me.callParent(arguments);
        
        if (owner.floating) {
            ownerContext.savedXY = owner.getXY();
            // move way offscreen to prevent any constraining
            // only move on the y axis to avoid triggering a horizontal scrollbar in rtl mode
            owner.setXY([0, -9999]);
        }
        
        if (toolbar) {
            ownerContext.toolbarContext = ownerContext.context.getCmp(toolbar);
        }
        ownerContext.listContext = ownerContext.getEl('listEl');
    },
    
    beginLayoutCycle: function(ownerContext){
        var owner = this.owner;
        
        this.callParent(arguments);
        if (ownerContext.heightModel.auto) {
            // Set the el/listEl to be autoHeight since they may have been previously sized
            // by another layout process. If the el was at maxHeight first, the listEl will
            // always size to the maxHeight regardless of the content.
            owner.el.setHeight('auto');
            owner.listEl.setHeight('auto');
        }
    },

    getLayoutItems: function() {
        var toolbar = this.owner.pagingToolbar;
        return toolbar ? [toolbar] : [];
    },
    
    isValidParent: function() {
        // this only ever gets called with the toolbar, since it's rendered inside we
        // know the parent is always valid
        return true;
    },

    finishedLayout: function(ownerContext) {
        var xy = ownerContext.savedXY;
        
        this.callParent(arguments);
        if (xy) {
            this.owner.setXY(xy);
        }
    },
    
    measureContentWidth: function(ownerContext) {
        return this.owner.listEl.getWidth();
    },
    
    measureContentHeight: function(ownerContext) {
        return this.owner.listEl.getHeight();
    },
    
    publishInnerHeight: function(ownerContext, height) {
        var toolbar = ownerContext.toolbarContext,
            toolbarHeight = 0;
            
        if (toolbar) {
            toolbarHeight = toolbar.getProp('height');
        }
        
        if (toolbarHeight === undefined) {
            this.done = false;
        } else {
            ownerContext.listContext.setHeight(height - ownerContext.getFrameInfo().height - toolbarHeight);
        }
    },
    
    calculateOwnerHeightFromContentHeight: function(ownerContext){
        var height = this.callParent(arguments),
            toolbar = ownerContext.toolbarContext;
            
        if (toolbar) {
            height += toolbar.getProp('height');
        }
        return height;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * A field with a pair of up/down spinner buttons. This class is not normally instantiated directly,
 * instead it is subclassed and the {@link #onSpinUp} and {@link #onSpinDown} methods are implemented
 * to handle when the buttons are clicked. A good example of this is the {@link Ext.form.field.Number}
 * field which uses the spinner to increment and decrement the field's value by its
 * {@link Ext.form.field.Number#step step} config value.
 *
 * For example:
 *
 *     @example
 *     Ext.define('Ext.ux.CustomSpinner', {
 *         extend: 'Ext.form.field.Spinner',
 *         alias: 'widget.customspinner',
 *
 *         // override onSpinUp (using step isn't neccessary)
 *         onSpinUp: function() {
 *             var me = this;
 *             if (!me.readOnly) {
 *                 var val = parseInt(me.getValue().split(' '), 10)||0; // gets rid of " Pack", defaults to zero on parse failure
 *                 me.setValue((val + me.step) + ' Pack');
 *             }
 *         },
 *
 *         // override onSpinDown
 *         onSpinDown: function() {
 *             var me = this;
 *             if (!me.readOnly) {
 *                var val = parseInt(me.getValue().split(' '), 10)||0; // gets rid of " Pack", defaults to zero on parse failure
 *                if (val <= me.step) {
 *                    me.setValue('Dry!');
 *                } else {
 *                    me.setValue((val - me.step) + ' Pack');
 *                }
 *             }
 *         }
 *     });
 *
 *     Ext.create('Ext.form.FormPanel', {
 *         title: 'Form with SpinnerField',
 *         bodyPadding: 5,
 *         width: 350,
 *         renderTo: Ext.getBody(),
 *         items:[{
 *             xtype: 'customspinner',
 *             fieldLabel: 'How Much Beer?',
 *             step: 6
 *         }]
 *     });
 *
 * By default, pressing the up and down arrow keys will also trigger the onSpinUp and onSpinDown methods;
 * to prevent this, set `{@link #keyNavEnabled} = false`.
 */
Ext.define('Ext.form.field.Spinner', {
    extend:  Ext.form.field.Trigger ,
    alias: 'widget.spinnerfield',
    alternateClassName: 'Ext.form.Spinner',
                                  

    trigger1Cls: Ext.baseCSSPrefix + 'form-spinner-up',
    trigger2Cls: Ext.baseCSSPrefix + 'form-spinner-down',

    /**
     * @cfg {Boolean} spinUpEnabled
     * Specifies whether the up spinner button is enabled. Defaults to true. To change this after the component is
     * created, use the {@link #setSpinUpEnabled} method.
     */
    spinUpEnabled: true,

    /**
     * @cfg {Boolean} spinDownEnabled
     * Specifies whether the down spinner button is enabled. Defaults to true. To change this after the component is
     * created, use the {@link #setSpinDownEnabled} method.
     */
    spinDownEnabled: true,

    /**
     * @cfg {Boolean} keyNavEnabled
     * Specifies whether the up and down arrow keys should trigger spinning up and down. Defaults to true.
     */
    keyNavEnabled: true,

    /**
     * @cfg {Boolean} mouseWheelEnabled
     * Specifies whether the mouse wheel should trigger spinning up and down while the field has focus.
     * Defaults to true.
     */
    mouseWheelEnabled: true,

    /**
     * @cfg {Boolean} repeatTriggerClick
     * Whether a {@link Ext.util.ClickRepeater click repeater} should be attached to the spinner buttons.
     * Defaults to true.
     */
    repeatTriggerClick: true,

    /**
     * @method
     * @protected
     * This method is called when the spinner up button is clicked, or when the up arrow key is pressed if
     * {@link #keyNavEnabled} is true. Must be implemented by subclasses.
     */
    onSpinUp: Ext.emptyFn,

    /**
     * @method
     * @protected
     * This method is called when the spinner down button is clicked, or when the down arrow key is pressed if
     * {@link #keyNavEnabled} is true. Must be implemented by subclasses.
     */
    onSpinDown: Ext.emptyFn,

    triggerTpl: '<td style="{triggerStyle}" class="{triggerCls}">' +
                    '<div class="' + Ext.baseCSSPrefix + 'trigger-index-0 ' + Ext.baseCSSPrefix + 'form-trigger ' + Ext.baseCSSPrefix + 'form-spinner-up {spinnerUpCls} {childElCls}" role="button"></div>' +
                    '<div class="' + Ext.baseCSSPrefix + 'trigger-index-1 ' + Ext.baseCSSPrefix + 'form-trigger ' + Ext.baseCSSPrefix + 'form-spinner-down {spinnerDownCls} {childElCls}" role="button"></div>' +
                '</td>' +
            '</tr>',

    initComponent: function() {
        this.callParent();

        this.addEvents(
            /**
             * @event spin
             * Fires when the spinner is made to spin up or down.
             * @param {Ext.form.field.Spinner} this
             * @param {String} direction Either 'up' if spinning up, or 'down' if spinning down.
             */
            'spin',

            /**
             * @event spinup
             * Fires when the spinner is made to spin up.
             * @param {Ext.form.field.Spinner} this
             */
            'spinup',

            /**
             * @event spindown
             * Fires when the spinner is made to spin down.
             * @param {Ext.form.field.Spinner} this
             */
            'spindown'
        );
    },

    /**
     * @private
     * Override.
     */
    onRender: function() {
        var me = this,
            triggers;

        me.callParent(arguments);
        triggers = me.triggerEl;
        
        /**
         * @property {Ext.Element} spinUpEl
         * The spinner up button element
         */
        me.spinUpEl = triggers.item(0);
        /**
         * @property {Ext.Element} spinDownEl
         * The spinner down button element
         */
        me.spinDownEl = triggers.item(1);
        
        me.triggerCell = me.spinUpEl.parent(); 

        // Init up/down arrow keys
        if (me.keyNavEnabled) {
            me.spinnerKeyNav = new Ext.util.KeyNav(me.inputEl, {
                scope: me,
                up: me.spinUp,
                down: me.spinDown
            });
        }

        // Init mouse wheel
        if (me.mouseWheelEnabled) {
            me.mon(me.bodyEl, 'mousewheel', me.onMouseWheel, me);
        }
    },

    getSubTplMarkup: function(values) {
        var me = this,
            childElCls = values.childElCls, // either '' or ' x-foo'
            field = Ext.form.field.Base.prototype.getSubTplMarkup.apply(me, arguments);

        return '<table id="' + me.id + '-triggerWrap" class="' + Ext.baseCSSPrefix + 'form-trigger-wrap' + childElCls + '" cellpadding="0" cellspacing="0">' +
            '<tbody>' +
                '<tr><td id="' + me.id + '-inputCell" class="' + Ext.baseCSSPrefix + 'form-trigger-input-cell' + childElCls + '">' + field + '</td>' +
                me.getTriggerMarkup() +
            '</tbody></table>';
    },

    getTriggerMarkup: function() {
        return this.getTpl('triggerTpl').apply(this.getTriggerData());
    },
    
    getTriggerData: function(){
        var me = this,
            hideTrigger = (me.readOnly || me.hideTrigger);
            
        return {
            triggerCls: Ext.baseCSSPrefix + 'trigger-cell',
            triggerStyle: hideTrigger ? 'display:none' : '',
            spinnerUpCls: !me.spinUpEnabled ? me.trigger1Cls + '-disabled': '',
            spinnerDownCls: !me.spinDownEnabled ? me.trigger2Cls + '-disabled': ''
        };
    },

    /**
     * Get the total width of the spinner button area.
     * @return {Number} The total spinner button width
     */
    getTriggerWidth: function() {
        var me = this,
            totalTriggerWidth = 0;

        if (me.triggerWrap && !me.hideTrigger && !me.readOnly) {
            totalTriggerWidth = me.triggerWidth;
        }
        return totalTriggerWidth;
    },

    /**
     * @private
     * Handles the spinner up button clicks.
     */
    onTrigger1Click: function() {
        this.spinUp();
    },

    /**
     * @private
     * Handles the spinner down button clicks.
     */
    onTrigger2Click: function() {
        this.spinDown();
    },

    // private
    // Handle trigger mouse up gesture; refocuses the input element upon end of spin.
    onTriggerWrapMouseup: function() {
        this.inputEl.focus();
    },

    /**
     * Triggers the spinner to step up; fires the {@link #spin} and {@link #spinup} events and calls the
     * {@link #onSpinUp} method. Does nothing if the field is {@link #disabled} or if {@link #spinUpEnabled}
     * is false.
     */
    spinUp: function() {
        var me = this;
        if (me.spinUpEnabled && !me.disabled) {
            me.fireEvent('spin', me, 'up');
            me.fireEvent('spinup', me);
            me.onSpinUp();
        }
    },

    /**
     * Triggers the spinner to step down; fires the {@link #spin} and {@link #spindown} events and calls the
     * {@link #onSpinDown} method. Does nothing if the field is {@link #disabled} or if {@link #spinDownEnabled}
     * is false.
     */
    spinDown: function() {
        var me = this;
        if (me.spinDownEnabled && !me.disabled) {
            me.fireEvent('spin', me, 'down');
            me.fireEvent('spindown', me);
            me.onSpinDown();
        }
    },

    /**
     * Sets whether the spinner up button is enabled.
     * @param {Boolean} enabled true to enable the button, false to disable it.
     */
    setSpinUpEnabled: function(enabled) {
        var me = this,
            wasEnabled = me.spinUpEnabled;
        me.spinUpEnabled = enabled;
        if (wasEnabled !== enabled && me.rendered) {
            me.spinUpEl[enabled ? 'removeCls' : 'addCls'](me.trigger1Cls + '-disabled');
        }
    },

    /**
     * Sets whether the spinner down button is enabled.
     * @param {Boolean} enabled true to enable the button, false to disable it.
     */
    setSpinDownEnabled: function(enabled) {
        var me = this,
            wasEnabled = me.spinDownEnabled;
        me.spinDownEnabled = enabled;
        if (wasEnabled !== enabled && me.rendered) {
            me.spinDownEl[enabled ? 'removeCls' : 'addCls'](me.trigger2Cls + '-disabled');
        }
    },

    /**
     * @private
     * Handles mousewheel events on the field
     */
    onMouseWheel: function(e) {
        var me = this,
            delta;
        if (me.hasFocus) {
            delta = e.getWheelDelta();
            if (delta > 0) {
                me.spinUp();
            } else if (delta < 0) {
                me.spinDown();
            }
            e.stopEvent();
        }
    },

    onDestroy: function() {
        Ext.destroyMembers(this, 'spinnerKeyNav', 'spinUpEl', 'spinDownEl');
        this.callParent();
    }

});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @docauthor Jason Johnston <jason@sencha.com>
 *
 * A numeric text field that provides automatic keystroke filtering to disallow non-numeric characters,
 * and numeric validation to limit the value to a range of valid numbers. The range of acceptable number
 * values can be controlled by setting the {@link #minValue} and {@link #maxValue} configs, and fractional
 * decimals can be disallowed by setting {@link #allowDecimals} to `false`.
 *
 * By default, the number field is also rendered with a set of up/down spinner buttons and has
 * up/down arrow key and mouse wheel event listeners attached for incrementing/decrementing the value by the
 * {@link #step} value. To hide the spinner buttons set `{@link #hideTrigger hideTrigger}:true`; to disable
 * the arrow key and mouse wheel handlers set `{@link #keyNavEnabled keyNavEnabled}:false` and
 * `{@link #mouseWheelEnabled mouseWheelEnabled}:false`. See the example below.
 *
 * # Example usage
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'On The Wall',
 *         width: 300,
 *         bodyPadding: 10,
 *         renderTo: Ext.getBody(),
 *         items: [{
 *             xtype: 'numberfield',
 *             anchor: '100%',
 *             name: 'bottles',
 *             fieldLabel: 'Bottles of Beer',
 *             value: 99,
 *             maxValue: 99,
 *             minValue: 0
 *         }],
 *         buttons: [{
 *             text: 'Take one down, pass it around',
 *             handler: function() {
 *                 this.up('form').down('[name=bottles]').spinDown();
 *             }
 *         }]
 *     });
 *
 * # Removing UI Enhancements
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'Personal Info',
 *         width: 300,
 *         bodyPadding: 10,
 *         renderTo: Ext.getBody(),
 *         items: [{
 *             xtype: 'numberfield',
 *             anchor: '100%',
 *             name: 'age',
 *             fieldLabel: 'Age',
 *             minValue: 0, //prevents negative numbers
 *
 *             // Remove spinner buttons, and arrow key and mouse wheel listeners
 *             hideTrigger: true,
 *             keyNavEnabled: false,
 *             mouseWheelEnabled: false
 *         }]
 *     });
 *
 * # Using Step
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'Step',
 *         width: 300,
 *         bodyPadding: 10,
 *         items: [{
 *             xtype: 'numberfield',
 *             anchor: '100%',
 *             name: 'evens',
 *             fieldLabel: 'Even Numbers',
 *
 *             // Set step so it skips every other number
 *             step: 2,
 *             value: 0,
 *
 *             // Add change handler to force user-entered numbers to evens
 *             listeners: {
 *                 change: function(field, value) {
 *                     value = parseInt(value, 10);
 *                     field.setValue(value + value % 2);
 *                 }
 *             }
 *         }]
 *     });
 */
Ext.define('Ext.form.field.Number', {
    extend: Ext.form.field.Spinner ,
    alias: 'widget.numberfield',
    alternateClassName: ['Ext.form.NumberField', 'Ext.form.Number'],

    /**
     * @cfg {RegExp} stripCharsRe
     * @private
     */
    /**
     * @cfg {RegExp} maskRe
     * @private
     */
     
    /**
     * @cfg {Boolean} [allowExponential=true]
     * Set to `false` to disallow Exponential number notation
     */
    allowExponential: true,

    /**
     * @cfg {Boolean} [allowDecimals=true]
     * False to disallow decimal values
     */
    allowDecimals : true,

    //<locale>
    /**
     * @cfg {String} decimalSeparator
     * Character(s) to allow as the decimal separator
     */
    decimalSeparator : '.',
    //</locale>
    
    //<locale>
    /**
     * @cfg {Boolean} [submitLocaleSeparator=true]
     * False to ensure that the {@link #getSubmitValue} method strips
     * always uses `.` as the separator, regardless of the {@link #decimalSeparator}
     * configuration.
     */
    submitLocaleSeparator: true,
    //</locale>

    //<locale>
    /**
     * @cfg {Number} decimalPrecision
     * The maximum precision to display after the decimal separator
     */
    decimalPrecision : 2,
    //</locale>

    /**
     * @cfg {Number} minValue
     * The minimum allowed value. Will be used by the field's validation logic,
     * and for {@link Ext.form.field.Spinner#setSpinUpEnabled enabling/disabling the down spinner button}.
     *
     * Defaults to Number.NEGATIVE_INFINITY.
     */
    minValue: Number.NEGATIVE_INFINITY,

    /**
     * @cfg {Number} maxValue
     * The maximum allowed value. Will be used by the field's validation logic, and for
     * {@link Ext.form.field.Spinner#setSpinUpEnabled enabling/disabling the up spinner button}.
     *
     * Defaults to Number.MAX_VALUE.
     */
    maxValue: Number.MAX_VALUE,

    /**
     * @cfg {Number} step
     * Specifies a numeric interval by which the field's value will be incremented or decremented when the user invokes
     * the spinner.
     */
    step: 1,

    //<locale>
    /**
     * @cfg {String} minText
     * Error text to display if the minimum value validation fails.
     */
    minText : 'The minimum value for this field is {0}',
    //</locale>

    //<locale>
    /**
     * @cfg {String} maxText
     * Error text to display if the maximum value validation fails.
     */
    maxText : 'The maximum value for this field is {0}',
    //</locale>

    //<locale>
    /**
     * @cfg {String} nanText
     * Error text to display if the value is not a valid number. For example, this can happen if a valid character like
     * '.' or '-' is left in the field with no number.
     */
    nanText : '{0} is not a valid number',
    //</locale>

    //<locale>
    /**
     * @cfg {String} negativeText
     * Error text to display if the value is negative and {@link #minValue} is set to 0. This is used instead of the
     * {@link #minText} in that circumstance only.
     */
    negativeText : 'The value cannot be negative',
    //</locale>

    /**
     * @cfg {String} baseChars
     * The base set of characters to evaluate as valid numbers.
     */
    baseChars : '0123456789',

    /**
     * @cfg {Boolean} autoStripChars
     * True to automatically strip not allowed characters from the field.
     */
    autoStripChars: false,

    initComponent: function() {
        var me = this;
        me.callParent();

        me.setMinValue(me.minValue);
        me.setMaxValue(me.maxValue);
    },

    /**
     * Runs all of Number's validations and returns an array of any errors. Note that this first runs Text's
     * validations, so the returned array is an amalgamation of all field errors. The additional validations run test
     * that the value is a number, and that it is within the configured min and max values.
     * @param {Object} [value] The value to get errors for (defaults to the current field value)
     * @return {String[]} All validation errors for this field
     */
    getErrors: function(value) {
        var me = this,
            errors = me.callParent(arguments),
            format = Ext.String.format,
            num;

        value = Ext.isDefined(value) ? value : this.processRawValue(this.getRawValue());

        if (value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
             return errors;
        }

        value = String(value).replace(me.decimalSeparator, '.');

        if(isNaN(value)){
            errors.push(format(me.nanText, value));
        }

        num = me.parseValue(value);

        if (me.minValue === 0 && num < 0) {
            errors.push(this.negativeText);
        }
        else if (num < me.minValue) {
            errors.push(format(me.minText, me.minValue));
        }

        if (num > me.maxValue) {
            errors.push(format(me.maxText, me.maxValue));
        }


        return errors;
    },

    rawToValue: function(rawValue) {
        var value = this.fixPrecision(this.parseValue(rawValue));
        if (value === null) {
            value = rawValue || null;
        }
        return  value;
    },

    valueToRaw: function(value) {
        var me = this,
            decimalSeparator = me.decimalSeparator;
        value = me.parseValue(value);
        value = me.fixPrecision(value);
        value = Ext.isNumber(value) ? value : parseFloat(String(value).replace(decimalSeparator, '.'));
        value = isNaN(value) ? '' : String(value).replace('.', decimalSeparator);
        return value;
    },
    
    getSubmitValue: function() {
        var me = this,
            value = me.callParent();
            
        if (!me.submitLocaleSeparator) {
            value = value.replace(me.decimalSeparator, '.');
        }  
        return value;
    },

    onChange: function() {
        this.toggleSpinners();
        this.callParent(arguments);
    },
    
    toggleSpinners: function(){
        var me = this,
            value = me.getValue(),
            valueIsNull = value === null,
            enabled;
        
        // If it's disabled, only allow it to be re-enabled if we are
        // the ones who are disabling it.
        if (me.spinUpEnabled || me.spinUpDisabledByToggle) {
            enabled = valueIsNull || value < me.maxValue;
            me.setSpinUpEnabled(enabled, true);
        }
        
        
        if (me.spinDownEnabled || me.spinDownDisabledByToggle) {
            enabled = valueIsNull || value > me.minValue;
            me.setSpinDownEnabled(enabled, true);
        }
    },

    /**
     * Replaces any existing {@link #minValue} with the new value.
     * @param {Number} value The minimum value
     */
    setMinValue : function(value) {
        var me = this,
            allowed;
        
        me.minValue = Ext.Number.from(value, Number.NEGATIVE_INFINITY);
        me.toggleSpinners();
        
        // Build regexes for masking and stripping based on the configured options
        if (me.disableKeyFilter !== true) {
            allowed = me.baseChars + '';
            
            if (me.allowExponential) {
                allowed += me.decimalSeparator + 'e+-';
            }
            else {
                if (me.allowDecimals) {
                    allowed += me.decimalSeparator;
                }
                if (me.minValue < 0) {
                    allowed += '-';
                }
            }
            
            allowed = Ext.String.escapeRegex(allowed);
            me.maskRe = new RegExp('[' + allowed + ']');
            if (me.autoStripChars) {
                me.stripCharsRe = new RegExp('[^' + allowed + ']', 'gi');
            }
        }
    },

    /**
     * Replaces any existing {@link #maxValue} with the new value.
     * @param {Number} value The maximum value
     */
    setMaxValue: function(value) {
        this.maxValue = Ext.Number.from(value, Number.MAX_VALUE);
        this.toggleSpinners();
    },

    // private
    parseValue : function(value) {
        value = parseFloat(String(value).replace(this.decimalSeparator, '.'));
        return isNaN(value) ? null : value;
    },

    /**
     * @private
     */
    fixPrecision : function(value) {
        var me = this,
            nan = isNaN(value),
            precision = me.decimalPrecision;

        if (nan || !value) {
            return nan ? '' : value;
        } else if (!me.allowDecimals || precision <= 0) {
            precision = 0;
        }

        return parseFloat(Ext.Number.toFixed(parseFloat(value), precision));
    },

    beforeBlur : function() {
        var me = this,
            v = me.parseValue(me.getRawValue());

        if (!Ext.isEmpty(v)) {
            me.setValue(v);
        }
    },
    
    setSpinUpEnabled: function(enabled, /* private */ internal){
        this.callParent(arguments);
        if (!internal) {
            delete this.spinUpDisabledByToggle;
        } else {
            this.spinUpDisabledByToggle = !enabled;
        }
    },

    onSpinUp: function() {
        var me = this;
            
        if (!me.readOnly) {
            me.setSpinValue(Ext.Number.constrain(me.getValue() + me.step, me.minValue, me.maxValue));
        }
    },
    
    setSpinDownEnabled: function(enabled, /* private */ internal){
        this.callParent(arguments);
        if (!internal) {
            delete this.spinDownDisabledByToggle;
        } else {
            this.spinDownDisabledByToggle = !enabled;
        }   
    },

    onSpinDown: function() {
        var me = this;
        
        if (!me.readOnly) {
            me.setSpinValue(Ext.Number.constrain(me.getValue() - me.step, me.minValue, me.maxValue));
        }
    },
    
    setSpinValue: function(value) {
        var me = this,
            len;
            
        if (me.enforceMaxLength) {
            // We need to round the value here, otherwise we could end up with a
            // very long number (think 0.1 + 0.2)
            if (me.fixPrecision(value).toString().length > me.maxLength) {
                return;
            }
        }
        me.setValue(value);
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * As the number of records increases, the time required for the browser to render them increases. Paging is used to
 * reduce the amount of data exchanged with the client. Note: if there are more records/rows than can be viewed in the
 * available screen area, vertical scrollbars will be added.
 *
 * Paging is typically handled on the server side (see exception below). The client sends parameters to the server side,
 * which the server needs to interpret and then respond with the appropriate data.
 *
 * Ext.toolbar.Paging is a specialized toolbar that is bound to a {@link Ext.data.Store} and provides automatic
 * paging control. This Component {@link Ext.data.Store#method-load load}s blocks of data into the {@link #store} by passing
 * parameters used for paging criteria.
 *
 * {@img Ext.toolbar.Paging/Ext.toolbar.Paging.png Ext.toolbar.Paging component}
 *
 * Paging Toolbar is typically used as one of the Grid's toolbars:
 *
 *     @example
 *     var itemsPerPage = 2;   // set the number of items you want per page
 *
 *     var store = Ext.create('Ext.data.Store', {
 *         id:'simpsonsStore',
 *         autoLoad: false,
 *         fields:['name', 'email', 'phone'],
 *         pageSize: itemsPerPage, // items per page
 *         proxy: {
 *             type: 'ajax',
 *             url: 'pagingstore.js',  // url that will load data with respect to start and limit params
 *             reader: {
 *                 type: 'json',
 *                 root: 'items',
 *                 totalProperty: 'total'
 *             }
 *         }
 *     });
 *
 *     // specify segment of data you want to load using params
 *     store.load({
 *         params:{
 *             start:0,
 *             limit: itemsPerPage
 *         }
 *     });
 *
 *     Ext.create('Ext.grid.Panel', {
 *         title: 'Simpsons',
 *         store: store,
 *         columns: [
 *             { header: 'Name',  dataIndex: 'name' },
 *             { header: 'Email', dataIndex: 'email', flex: 1 },
 *             { header: 'Phone', dataIndex: 'phone' }
 *         ],
 *         width: 400,
 *         height: 125,
 *         dockedItems: [{
 *             xtype: 'pagingtoolbar',
 *             store: store,   // same store GridPanel is using
 *             dock: 'bottom',
 *             displayInfo: true
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 *
 * To use paging, you need to set a pageSize configuration on the Store, and pass the paging requirements to
 * the server when the store is first loaded.
 *
 *     store.load({
 *         params: {
 *             // specify params for the first page load if using paging
 *             start: 0,
 *             limit: myPageSize,
 *             // other params
 *             foo:   'bar'
 *         }
 *     });
 *
 * If using {@link Ext.data.Store#autoLoad store's autoLoad} configuration:
 *
 *     var myStore = Ext.create('Ext.data.Store', {
 *         {@link Ext.data.Store#autoLoad autoLoad}: {start: 0, limit: 25},
 *         ...
 *     });
 *
 * The packet sent back from the server would have this form:
 *
 *     {
 *         "success": true,
 *         "results": 2000,
 *         "rows": [ // ***Note:** this must be an Array
 *             { "id":  1, "name": "Bill", "occupation": "Gardener" },
 *             { "id":  2, "name":  "Ben", "occupation": "Horticulturalist" },
 *             ...
 *             { "id": 25, "name":  "Sue", "occupation": "Botanist" }
 *         ]
 *     }
 *
 * ## Paging with Local Data
 *
 * Paging can also be accomplished with local data using extensions:
 *
 *   - [Ext.ux.data.PagingStore][1]
 *   - Paging Memory Proxy (examples/ux/PagingMemoryProxy.js)
 *
 *    [1]: http://sencha.com/forum/showthread.php?t=71532
 */
Ext.define('Ext.toolbar.Paging', {
    extend:  Ext.toolbar.Toolbar ,
    alias: 'widget.pagingtoolbar',
    alternateClassName: 'Ext.PagingToolbar',
                                                                
    mixins: {
        bindable:  Ext.util.Bindable     
    },
    /**
     * @cfg {Ext.data.Store} store (required)
     * The {@link Ext.data.Store} the paging toolbar should use as its data source.
     */

    /**
     * @cfg {Boolean} displayInfo
     * true to display the displayMsg
     */
    displayInfo: false,

    /**
     * @cfg {Boolean} prependButtons
     * true to insert any configured items _before_ the paging buttons.
     */
    prependButtons: false,

    //<locale>
    /**
     * @cfg {String} displayMsg
     * The paging status message to display. Note that this string is
     * formatted using the braced numbers {0}-{2} as tokens that are replaced by the values for start, end and total
     * respectively. These tokens should be preserved when overriding this string if showing those values is desired.
     */
    displayMsg : 'Displaying {0} - {1} of {2}',
    //</locale>

    //<locale>
    /**
     * @cfg {String} emptyMsg
     * The message to display when no records are found.
     */
    emptyMsg : 'No data to display',
    //</locale>

    //<locale>
    /**
     * @cfg {String} beforePageText
     * The text displayed before the input item.
     */
    beforePageText : 'Page',
    //</locale>

    //<locale>
    /**
     * @cfg {String} afterPageText
     * Customizable piece of the default paging text. Note that this string is formatted using
     * {0} as a token that is replaced by the number of total pages. This token should be preserved when overriding this
     * string if showing the total page count is desired.
     */
    afterPageText : 'of {0}',
    //</locale>

    //<locale>
    /**
     * @cfg {String} firstText
     * The quicktip text displayed for the first page button.
     * **Note**: quick tips must be initialized for the quicktip to show.
     */
    firstText : 'First Page',
    //</locale>

    //<locale>
    /**
     * @cfg {String} prevText
     * The quicktip text displayed for the previous page button.
     * **Note**: quick tips must be initialized for the quicktip to show.
     */
    prevText : 'Previous Page',
    //</locale>

    //<locale>
    /**
     * @cfg {String} nextText
     * The quicktip text displayed for the next page button.
     * **Note**: quick tips must be initialized for the quicktip to show.
     */
    nextText : 'Next Page',
    //</locale>

    //<locale>
    /**
     * @cfg {String} lastText
     * The quicktip text displayed for the last page button.
     * **Note**: quick tips must be initialized for the quicktip to show.
     */
    lastText : 'Last Page',
    //</locale>

    //<locale>
    /**
     * @cfg {String} refreshText
     * The quicktip text displayed for the Refresh button.
     * **Note**: quick tips must be initialized for the quicktip to show.
     */
    refreshText : 'Refresh',
    //</locale>

    /**
     * @cfg {Number} inputItemWidth
     * The width in pixels of the input field used to display and change the current page number.
     */
    inputItemWidth : 30,

    /**
     * Gets the standard paging items in the toolbar
     * @private
     */
    getPagingItems: function() {
        var me = this;

        return [{
            itemId: 'first',
            tooltip: me.firstText,
            overflowText: me.firstText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-first',
            disabled: true,
            handler: me.moveFirst,
            scope: me
        },{
            itemId: 'prev',
            tooltip: me.prevText,
            overflowText: me.prevText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
            disabled: true,
            handler: me.movePrevious,
            scope: me
        },
        '-',
        me.beforePageText,
        {
            xtype: 'numberfield',
            itemId: 'inputItem',
            name: 'inputItem',
            cls: Ext.baseCSSPrefix + 'tbar-page-number',
            allowDecimals: false,
            minValue: 1,
            hideTrigger: true,
            enableKeyEvents: true,
            keyNavEnabled: false,
            selectOnFocus: true,
            submitValue: false,
            // mark it as not a field so the form will not catch it when getting fields
            isFormField: false,
            width: me.inputItemWidth,
            margins: '-1 2 3 2',
            listeners: {
                scope: me,
                keydown: me.onPagingKeyDown,
                blur: me.onPagingBlur
            }
        },{
            xtype: 'tbtext',
            itemId: 'afterTextItem',
            text: Ext.String.format(me.afterPageText, 1)
        },
        '-',
        {
            itemId: 'next',
            tooltip: me.nextText,
            overflowText: me.nextText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
            disabled: true,
            handler: me.moveNext,
            scope: me
        },{
            itemId: 'last',
            tooltip: me.lastText,
            overflowText: me.lastText,
            iconCls: Ext.baseCSSPrefix + 'tbar-page-last',
            disabled: true,
            handler: me.moveLast,
            scope: me
        },
        '-',
        {
            itemId: 'refresh',
            tooltip: me.refreshText,
            overflowText: me.refreshText,
            iconCls: Ext.baseCSSPrefix + 'tbar-loading',
            handler: me.doRefresh,
            scope: me
        }];
    },

    initComponent : function(){
        var me = this,
            pagingItems = me.getPagingItems(),
            userItems   = me.items || me.buttons || [];

        if (me.prependButtons) {
            me.items = userItems.concat(pagingItems);
        } else {
            me.items = pagingItems.concat(userItems);
        }
        delete me.buttons;

        if (me.displayInfo) {
            me.items.push('->');
            me.items.push({xtype: 'tbtext', itemId: 'displayItem'});
        }

        me.callParent();

        me.addEvents(
            /**
             * @event change
             * Fires after the active page has been changed.
             * @param {Ext.toolbar.Paging} this
             * @param {Object} pageData An object that has these properties:
             *
             * - `total` : Number
             *
             *   The total number of records in the dataset as returned by the server
             *
             * - `currentPage` : Number
             *
             *   The current page number
             *
             * - `pageCount` : Number
             *
             *   The total number of pages (calculated from the total number of records in the dataset as returned by the
             *   server and the current {@link Ext.data.Store#pageSize pageSize})
             *
             * - `toRecord` : Number
             *
             *   The starting record index for the current page
             *
             * - `fromRecord` : Number
             *
             *   The ending record index for the current page
             */
            'change',

            /**
             * @event beforechange
             * Fires just before the active page is changed. Return false to prevent the active page from being changed.
             * @param {Ext.toolbar.Paging} this
             * @param {Number} page The page number that will be loaded on change
             */
            'beforechange'
        );
        me.on('beforerender', me.onLoad, me, {single: true});

        me.bindStore(me.store || 'ext-empty-store', true);
    },
    // @private
    updateInfo : function(){
        var me = this,
            displayItem = me.child('#displayItem'),
            store = me.store,
            pageData = me.getPageData(),
            count, msg;

        if (displayItem) {
            count = store.getCount();
            if (count === 0) {
                msg = me.emptyMsg;
            } else {
                msg = Ext.String.format(
                    me.displayMsg,
                    pageData.fromRecord,
                    pageData.toRecord,
                    pageData.total
                );
            }
            displayItem.setText(msg);
        }
    },

    // @private
    onLoad : function(){
        var me = this,
            pageData,
            currPage,
            pageCount,
            afterText,
            count,
            isEmpty,
            item;

        count = me.store.getCount();
        isEmpty = count === 0;
        if (!isEmpty) {
            pageData = me.getPageData();
            currPage = pageData.currentPage;
            pageCount = pageData.pageCount;
            afterText = Ext.String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
        } else {
            currPage = 0;
            pageCount = 0;
            afterText = Ext.String.format(me.afterPageText, 0);
        }

        Ext.suspendLayouts();
        item = me.child('#afterTextItem');
        if (item) {    
            item.setText(afterText);
        }
        item = me.getInputItem();
        if (item) {
            item.setDisabled(isEmpty).setValue(currPage);
        }
        me.setChildDisabled('#first', currPage === 1 || isEmpty);
        me.setChildDisabled('#prev', currPage === 1 || isEmpty);
        me.setChildDisabled('#next', currPage === pageCount  || isEmpty);
        me.setChildDisabled('#last', currPage === pageCount  || isEmpty);
        me.setChildDisabled('#refresh', false);
        me.updateInfo();
        Ext.resumeLayouts(true);

        if (me.rendered) {
            me.fireEvent('change', me, pageData);
        }
    },
    
    setChildDisabled: function(selector, disabled){
        var item = this.child(selector);
        if (item) {
            item.setDisabled(disabled);
        }
    },

    // @private
    getPageData : function(){
        var store = this.store,
            totalCount = store.getTotalCount();

        return {
            total : totalCount,
            currentPage : store.currentPage,
            pageCount: Math.ceil(totalCount / store.pageSize),
            fromRecord: ((store.currentPage - 1) * store.pageSize) + 1,
            toRecord: Math.min(store.currentPage * store.pageSize, totalCount)

        };
    },

    // @private
    onLoadError : function(){
        if (!this.rendered) {
            return;
        }
        this.setChildDisabled('#refresh', false);
    },
    
    getInputItem: function(){
        return this.child('#inputItem');
    },

    // @private
    readPageFromInput : function(pageData){
        var inputItem = this.getInputItem(),
            pageNum = false,
            v;

        if (inputItem) {
            v = inputItem.getValue();
            pageNum = parseInt(v, 10);
            if (!v || isNaN(pageNum)) {
                inputItem.setValue(pageData.currentPage);
                return false;
            }
        }
        return pageNum;
    },

    onPagingFocus : function(){
        var inputItem = this.getInputItem();
        if (inputItem) {
            inputItem.select();
        }
    },

    // @private
    onPagingBlur : function(e){
        var inputItem = this.getInputItem(),
            curPage;
            
        if (inputItem) {
            curPage = this.getPageData().currentPage;
            inputItem.setValue(curPage);
        }
    },

    // @private
    onPagingKeyDown : function(field, e){
        var me = this,
            k = e.getKey(),
            pageData = me.getPageData(),
            increment = e.shiftKey ? 10 : 1,
            pageNum;

        if (k == e.RETURN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum !== false) {
                pageNum = Math.min(Math.max(1, pageNum), pageData.pageCount);
                if(me.fireEvent('beforechange', me, pageNum) !== false){
                    me.store.loadPage(pageNum);
                }
            }
        } else if (k == e.HOME || k == e.END) {
            e.stopEvent();
            pageNum = k == e.HOME ? 1 : pageData.pageCount;
            field.setValue(pageNum);
        } else if (k == e.UP || k == e.PAGE_UP || k == e.DOWN || k == e.PAGE_DOWN) {
            e.stopEvent();
            pageNum = me.readPageFromInput(pageData);
            if (pageNum) {
                if (k == e.DOWN || k == e.PAGE_DOWN) {
                    increment *= -1;
                }
                pageNum += increment;
                if (pageNum >= 1 && pageNum <= pageData.pageCount) {
                    field.setValue(pageNum);
                }
            }
        }
    },

    // @private
    beforeLoad : function(){
        if (this.rendered) {
            this.setChildDisabled('#refresh', true);
        }
    },

    /**
     * Move to the first page, has the same effect as clicking the 'first' button.
     */
    moveFirst : function(){
        if (this.fireEvent('beforechange', this, 1) !== false){
            this.store.loadPage(1);
        }
    },

    /**
     * Move to the previous page, has the same effect as clicking the 'previous' button.
     */
    movePrevious : function(){
        var me = this,
            prev = me.store.currentPage - 1;

        if (prev > 0) {
            if (me.fireEvent('beforechange', me, prev) !== false) {
                me.store.previousPage();
            }
        }
    },

    /**
     * Move to the next page, has the same effect as clicking the 'next' button.
     */
    moveNext : function(){
        var me = this,
            total = me.getPageData().pageCount,
            next = me.store.currentPage + 1;

        if (next <= total) {
            if (me.fireEvent('beforechange', me, next) !== false) {
                me.store.nextPage();
            }
        }
    },

    /**
     * Move to the last page, has the same effect as clicking the 'last' button.
     */
    moveLast : function(){
        var me = this,
            last = me.getPageData().pageCount;

        if (me.fireEvent('beforechange', me, last) !== false) {
            me.store.loadPage(last);
        }
    },

    /**
     * Refresh the current page, has the same effect as clicking the 'refresh' button.
     */
    doRefresh : function(){
        var me = this,
            current = me.store.currentPage;

        if (me.fireEvent('beforechange', me, current) !== false) {
            me.store.loadPage(current);
        }
    },
    
    getStoreListeners: function() {
        return {
            beforeload: this.beforeLoad,
            load: this.onLoad,
            exception: this.onLoadError
        };
    },

    /**
     * Unbinds the paging toolbar from the specified {@link Ext.data.Store} **(deprecated)**
     * @param {Ext.data.Store} store The data store to unbind
     */
    unbind : function(store){
        this.bindStore(null);
    },

    /**
     * Binds the paging toolbar to the specified {@link Ext.data.Store} **(deprecated)**
     * @param {Ext.data.Store} store The data store to bind
     */
    bind : function(store){
        this.bindStore(store);
    },

    // @private
    onDestroy : function(){
        this.unbind();
        this.callParent();
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * An internally used DataView for {@link Ext.form.field.ComboBox ComboBox}.
 */
Ext.define('Ext.view.BoundList', {
    extend:  Ext.view.View ,
    alias: 'widget.boundlist',
    alternateClassName: 'Ext.BoundList',
                                                                       
    
    mixins: {
        queryable:  Ext.Queryable 
    },

    /**
     * @cfg {Number} [pageSize=0]
     * If greater than `0`, a {@link Ext.toolbar.Paging} is displayed at the bottom of the list and store
     * queries will execute with page {@link Ext.data.Operation#start start} and
     * {@link Ext.data.Operation#limit limit} parameters.
     */
    pageSize: 0,

    /**
     * @cfg {String} [displayField=""]
     * The field from the store to show in the view.
     */

    /**
     * @property {Ext.toolbar.Paging} pagingToolbar
     * A reference to the PagingToolbar instance in this view. Only populated if {@link #pageSize} is greater
     * than zero and the BoundList has been rendered.
     */

    // private overrides
    baseCls: Ext.baseCSSPrefix + 'boundlist',
    itemCls: Ext.baseCSSPrefix + 'boundlist-item',
    listItemCls: '',
    shadow: false,
    trackOver: true,
    refreshed: 0,

    // This Component is used as a popup, not part of a complex layout. Display data immediately.
    deferInitialRefresh: false,

    componentLayout: 'boundlist',

    childEls: [
        'listEl'
    ],

    renderTpl: [
        '<div id="{id}-listEl" class="{baseCls}-list-ct ', Ext.dom.Element.unselectableCls, '" style="overflow:auto"></div>',
        '{%',
            'var me=values.$comp, pagingToolbar=me.pagingToolbar;',
            'if (pagingToolbar) {',
                'pagingToolbar.ownerLayout = me.componentLayout;',
                'Ext.DomHelper.generateMarkup(pagingToolbar.getRenderTree(), out);',
            '}',
        '%}',
        {
            disableFormats: true
        }
    ],

    /**
     * @cfg {String/Ext.XTemplate} tpl
     * A String or Ext.XTemplate instance to apply to inner template.
     *
     * {@link Ext.view.BoundList} is used for the dropdown list of {@link Ext.form.field.ComboBox}.
     * To customize the template you can do this:
     *
     *     Ext.create('Ext.form.field.ComboBox', {
     *         fieldLabel   : 'State',
     *         queryMode    : 'local',
     *         displayField : 'text',
     *         valueField   : 'abbr',
     *         store        : Ext.create('StateStore', {
     *             fields : ['abbr', 'text'],
     *             data   : [
     *                 {"abbr":"AL", "name":"Alabama"},
     *                 {"abbr":"AK", "name":"Alaska"},
     *                 {"abbr":"AZ", "name":"Arizona"}
     *                 //...
     *             ]
     *         }),
     *         listConfig : {
     *             tpl : '<tpl for="."><div class="x-boundlist-item">{abbr}</div></tpl>'
     *         }
     *     });
     *
     * Defaults to:
     *
     *     Ext.create('Ext.XTemplate',
     *         '<ul><tpl for=".">',
     *             '<li role="option" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
     *         '</tpl></ul>'
     *     );
     *
     */

    initComponent: function() {
        var me = this,
            baseCls = me.baseCls,
            itemCls = me.itemCls;

        me.selectedItemCls = baseCls + '-selected';
        if (me.trackOver) {
            me.overItemCls = baseCls + '-item-over';
        }
        me.itemSelector = "." + itemCls;

        if (me.floating) {
            me.addCls(baseCls + '-floating');
        }

        if (!me.tpl) {
            // should be setting aria-posinset based on entire set of data
            // not filtered set
            me.tpl = new Ext.XTemplate(
                '<ul class="' + Ext.plainListCls + '"><tpl for=".">',
                    '<li role="option" unselectable="on" class="' + itemCls + '">' + me.getInnerTpl(me.displayField) + '</li>',
                '</tpl></ul>'
            );
        } else if (!me.tpl.isTemplate) {
            me.tpl = new Ext.XTemplate(me.tpl);
        }

        if (me.pageSize) {
            me.pagingToolbar = me.createPagingToolbar();
        }

        me.callParent();
    },

    beforeRender: function() {
        var me = this;

        me.callParent(arguments);

        // If there's a Menu among our ancestors, then add the menu class.
        // This is so that the MenuManager does not see a mousedown in this Component as a document mousedown, outside the Menu
        if (me.up('menu')) {
            me.addCls(Ext.baseCSSPrefix + 'menu');
        }
    },

    getRefOwner: function() {
        return this.pickerField || this.callParent();
    },

    getRefItems: function() {
        return this.pagingToolbar ? [ this.pagingToolbar ] : [];
    },

    createPagingToolbar: function() {
        return Ext.widget('pagingtoolbar', {
            id: this.id + '-paging-toolbar',
            pageSize: this.pageSize,
            store: this.dataSource,
            border: false,
            ownerCt: this,
            ownerLayout: this.getComponentLayout()
        });
    },

    // Do the job of a container layout at this point even though we are not a Container.
    // TODO: Refactor as a Container.
    finishRenderChildren: function () {
        var toolbar = this.pagingToolbar;

        this.callParent(arguments);

        if (toolbar) {
            toolbar.finishRender();
        }
    },

    refresh: function(){
        var me = this,
            tpl = me.tpl,
            toolbar = me.pagingToolbar,
            rendered = me.rendered;

        // Allow access to the context for XTemplate scriptlets
        tpl.field = me.pickerField;
        tpl.store = me.store;
        me.callParent();
        tpl.field =  tpl.store = null;

        // The view removes the targetEl from the DOM before updating the template
        // Ensure the toolbar goes to the end
        if (rendered && toolbar && toolbar.rendered && !me.preserveScrollOnRefresh) {
            me.el.appendChild(toolbar.el);
        }

        // IE6 strict can sometimes have repaint issues when showing
        // the list from a remote data source
        if (rendered && Ext.isIE6 && Ext.isStrict) {
            me.listEl.repaint();
        }
    },

    bindStore : function(store, initial) {
        var toolbar = this.pagingToolbar;

        this.callParent(arguments);
        if (toolbar) {
            toolbar.bindStore(store, initial);
        }
    },

    getTargetEl: function() {
        return this.listEl || this.el;
    },

    /**
     * A method that returns the inner template for displaying items in the list.
     * This method is useful to override when using a more complex display value, for example
     * inserting an icon along with the text.
     *
     * The XTemplate is created with a reference to the owning form field in the `field` property to provide access
     * to context. For example to highlight the currently typed value, the getInnerTpl may be configured into a 
     * ComboBox as part of the {@link Ext.form.field.ComboBox#listConfig listConfig}:
     *
     *    listConfig: {
     *        getInnerTpl: function() {
     *            return '{[values.name.replace(this.field.getRawValue(), "<b>" + this.field.getRawValue() + "</b>")]}';
     *        }
     *    }
     * @param {String} displayField The {@link #displayField} for the BoundList.
     * @return {String} The inner template
     */
    getInnerTpl: function(displayField) {
        return '{' + displayField + '}';
    },

    onDestroy: function() {
        Ext.destroyMembers(this, 'pagingToolbar', 'listEl');
        this.callParent();
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * A specialized {@link Ext.util.KeyNav} implementation for navigating a {@link Ext.view.BoundList} using
 * the keyboard. The up, down, pageup, pagedown, home, and end keys move the active highlight
 * through the list. The enter key invokes the selection model's select action using the highlighted item.
 */
Ext.define('Ext.view.BoundListKeyNav', {
    extend:  Ext.util.KeyNav ,
                                   

    /**
     * @cfg {Ext.view.BoundList} boundList (required)
     * The {@link Ext.view.BoundList} instance for which key navigation will be managed.
     */

    constructor: function(el, config) {
        var me = this;
        me.boundList = config.boundList;
        me.callParent([el, Ext.apply({}, config, me.defaultHandlers)]);
    },

    defaultHandlers: {
        up: function() {
            var me = this,
                boundList = me.boundList,
                allItems = boundList.all,
                oldItem = boundList.highlightedItem,
                oldItemIdx = oldItem ? boundList.indexOf(oldItem) : -1,
                newItemIdx = oldItemIdx > 0 ? oldItemIdx - 1 : allItems.getCount() - 1; //wraps around
            me.highlightAt(newItemIdx);
        },

        down: function() {
            var me = this,
                boundList = me.boundList,
                allItems = boundList.all,
                oldItem = boundList.highlightedItem,
                oldItemIdx = oldItem ? boundList.indexOf(oldItem) : -1,
                newItemIdx = oldItemIdx < allItems.getCount() - 1 ? oldItemIdx + 1 : 0; //wraps around
            me.highlightAt(newItemIdx);
        },

        pageup: function() {
            //TODO
        },

        pagedown: function() {
            //TODO
        },

        home: function() {
            this.highlightAt(0);
        },

        end: function() {
            var me = this;
            me.highlightAt(me.boundList.all.getCount() - 1);
        },

        enter: function(e) {
            this.selectHighlighted(e);
        }
    },

    /**
     * Highlights the item at the given index.
     * @param {Number} index
     */
    highlightAt: function(index) {
        var boundList = this.boundList,
            item = boundList.all.item(index);
        if (item) {
            item = item.dom;
            boundList.highlightItem(item);
            boundList.getTargetEl().scrollChildIntoView(item, false);
        }
    },

    /**
     * Triggers selection of the currently highlighted item according to the behavior of
     * the configured SelectionModel.
     */
    selectHighlighted: function(e) {
        var me = this,
            boundList = me.boundList,
            highlighted = boundList.highlightedItem,
            selModel = boundList.getSelectionModel();
        if (highlighted) {
            selModel.selectWithEvent(boundList.getRecord(highlighted), e);
        }
    }

});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @docauthor Jason Johnston <jason@sencha.com>
 *
 * A combobox control with support for autocomplete, remote loading, and many other features.
 *
 * A ComboBox is like a combination of a traditional HTML text `<input>` field and a `<select>`
 * field; the user is able to type freely into the field, and/or pick values from a dropdown selection
 * list. The user can input any value by default, even if it does not appear in the selection list;
 * to prevent free-form values and restrict them to items in the list, set {@link #forceSelection} to `true`.
 *
 * The selection list's options are populated from any {@link Ext.data.Store}, including remote
 * stores. The data items in the store are mapped to each option's displayed text and backing value via
 * the {@link #valueField} and {@link #displayField} configurations, respectively.
 *
 * If your store is not remote, i.e. it depends only on local data and is loaded up front, you should be
 * sure to set the {@link #queryMode} to `'local'`, as this will improve responsiveness for the user.
 *
 * # Example usage:
 *
 *     @example
 *     // The data store containing the list of states
 *     var states = Ext.create('Ext.data.Store', {
 *         fields: ['abbr', 'name'],
 *         data : [
 *             {"abbr":"AL", "name":"Alabama"},
 *             {"abbr":"AK", "name":"Alaska"},
 *             {"abbr":"AZ", "name":"Arizona"}
 *             //...
 *         ]
 *     });
 *
 *     // Create the combo box, attached to the states data store
 *     Ext.create('Ext.form.ComboBox', {
 *         fieldLabel: 'Choose State',
 *         store: states,
 *         queryMode: 'local',
 *         displayField: 'name',
 *         valueField: 'abbr',
 *         renderTo: Ext.getBody()
 *     });
 *
 * # Events
 *
 * To do something when something in ComboBox is selected, configure the select event:
 *
 *     var cb = Ext.create('Ext.form.ComboBox', {
 *         // all of your config options
 *         listeners:{
 *              scope: yourScope,
 *              'select': yourFunction
 *         }
 *     });
 *
 *     // Alternatively, you can assign events after the object is created:
 *     var cb = new Ext.form.field.ComboBox(yourOptions);
 *     cb.on('select', yourFunction, yourScope);
 *
 * # Multiple Selection
 *
 * ComboBox also allows selection of multiple items from the list; to enable multi-selection set the
 * {@link #multiSelect} config to `true`.
 * 
 * # Filtered Stores
 * 
 * If you have a local store that is already filtered, you can use the {@link #lastQuery} config option
 * to prevent the store from having the filter being cleared on first expand.
 *
 * ## Customized combobox
 *
 * Both the text shown in dropdown menu and text field can be easily customized:
 *
 *     @example
 *     var states = Ext.create('Ext.data.Store', {
 *         fields: ['abbr', 'name'],
 *         data : [
 *             {"abbr":"AL", "name":"Alabama"},
 *             {"abbr":"AK", "name":"Alaska"},
 *             {"abbr":"AZ", "name":"Arizona"}
 *         ]
 *     });
 *
 *     Ext.create('Ext.form.ComboBox', {
 *         fieldLabel: 'Choose State',
 *         store: states,
 *         queryMode: 'local',
 *         valueField: 'abbr',
 *         renderTo: Ext.getBody(),
 *         // Template for the dropdown menu.
 *         // Note the use of "x-boundlist-item" class,
 *         // this is required to make the items selectable.
 *         tpl: Ext.create('Ext.XTemplate',
 *             '<tpl for=".">',
 *                 '<div class="x-boundlist-item">{abbr} - {name}</div>',
 *             '</tpl>'
 *         ),
 *         // template for the content inside text field
 *         displayTpl: Ext.create('Ext.XTemplate',
 *             '<tpl for=".">',
 *                 '{abbr} - {name}',
 *             '</tpl>'
 *         )
 *     });
 *
 * See also the {@link #listConfig} option for additional configuration of the dropdown.
 *
 */
Ext.define('Ext.form.field.ComboBox', {
    extend: Ext.form.field.Picker ,
                                                                                                                                                                            
    alternateClassName: 'Ext.form.ComboBox',
    alias: ['widget.combobox', 'widget.combo'],
    mixins: {
        bindable:  Ext.util.Bindable     
    },

    componentLayout: 'combobox',

    /**
     * @cfg {String} [triggerCls='x-form-arrow-trigger']
     * An additional CSS class used to style the trigger button. The trigger will always get the {@link #triggerBaseCls}
     * by default and `triggerCls` will be **appended** if specified.
     */
    triggerCls: Ext.baseCSSPrefix + 'form-arrow-trigger',
    
    /**
     * @cfg {String} [hiddenName=""]
     * The name of an underlying hidden field which will be synchronized with the underlying value of the combo.
     * This option is useful if the combo is part of a form element doing a regular form post. The hidden field
     * will not be created unless a hiddenName is specified.
     */
    hiddenName: '',
    
    /**
     * @property {Ext.Element} hiddenDataEl
     * @private
     */

    /**
     * @private
     * @cfg {String}
     * CSS class used to find the {@link #hiddenDataEl}
     */
    hiddenDataCls: Ext.baseCSSPrefix + 'hide-display ' + Ext.baseCSSPrefix + 'form-data-hidden',

    /**
     * @cfg
     * @inheritdoc
     */
    fieldSubTpl: [
        '<div class="{hiddenDataCls}" role="presentation"></div>',
        '<input id="{id}" type="{type}" {inputAttrTpl} class="{fieldCls} {typeCls} {editableCls}" autocomplete="off"',
            '<tpl if="value"> value="{[Ext.util.Format.htmlEncode(values.value)]}"</tpl>',
            '<tpl if="name"> name="{name}"</tpl>',
            '<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
            '<tpl if="size"> size="{size}"</tpl>',
            '<tpl if="maxLength !== undefined"> maxlength="{maxLength}"</tpl>',
            '<tpl if="readOnly"> readonly="readonly"</tpl>',
            '<tpl if="disabled"> disabled="disabled"</tpl>',
            '<tpl if="tabIdx"> tabIndex="{tabIdx}"</tpl>',
            '<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
            '/>',
        {
            compiled: true,
            disableFormats: true
        }
    ],

    getSubTplData: function(){
        var me = this;
        Ext.applyIf(me.subTplData, {
            hiddenDataCls: me.hiddenDataCls
        });
        return me.callParent(arguments);
    },

    afterRender: function(){
        var me = this;
        me.callParent(arguments);
        me.setHiddenValue(me.value);
    },

    /**
     * @cfg {Ext.data.Store/String/Array} store
     * The data source to which this combo is bound. Acceptable values for this property are:
     *
     *   - **any {@link Ext.data.Store Store} subclass**
     *   - **an {@link Ext.data.Store#storeId ID of a store}**
     *   - **an Array** : Arrays will be converted to a {@link Ext.data.Store} internally, automatically generating
     *     {@link Ext.data.Field#name field names} to work with all data components.
     *
     *     - **1-dimensional array** : (e.g., `['Foo','Bar']`)
     *
     *       A 1-dimensional array will automatically be expanded (each array item will be used for both the combo
     *       {@link #valueField} and {@link #displayField})
     *
     *     - **2-dimensional array** : (e.g., `[['f','Foo'],['b','Bar']]`)
     *
     *       For a multi-dimensional array, the value in index 0 of each item will be assumed to be the combo
     *       {@link #valueField}, while the value at index 1 is assumed to be the combo {@link #displayField}.
     *
     * See also {@link #queryMode}.
     */

    /**
     * @cfg {Boolean} multiSelect
     * If set to `true`, allows the combo field to hold more than one value at a time, and allows selecting multiple
     * items from the dropdown list. The combo's text field will show all selected values separated by the
     * {@link #delimiter}.
     */
    multiSelect: false,

    //<locale>
    /**
     * @cfg {String} delimiter
     * The character(s) used to separate the {@link #displayField display values} of multiple selected items when
     * `{@link #multiSelect} = true`.
     */
    delimiter: ', ',
    //</locale>

    /**
     * @cfg {String} displayField
     * The underlying {@link Ext.data.Field#name data field name} to bind to this ComboBox.
     *
     * See also `{@link #valueField}`.
     */
    displayField: 'text',

    /**
     * @cfg {String} valueField (required)
     * The underlying {@link Ext.data.Field#name data value name} to bind to this ComboBox.
     *
     * **Note**: use of a `valueField` requires the user to make a selection in order for a value to be mapped. See also
     * `{@link #displayField}`.
     *
     * Defaults to match the value of the {@link #displayField} config.
     */

    /**
     * @cfg {String} triggerAction
     * The action to execute when the trigger is clicked.
     *
     *   - **`'all'`** :
     *
     *     {@link #doQuery run the query} specified by the `{@link #allQuery}` config option
     *
     *   - **`'last'`** :
     *
     *     {@link #doQuery run the query} using the `{@link #lastQuery last query value}`.
     *
     *   - **`'query'`** :
     *
     *     {@link #doQuery run the query} using the {@link Ext.form.field.Base#getRawValue raw value}.
     *
     * See also `{@link #queryParam}`.
     */
    triggerAction: 'all',

    /**
     * @cfg {String} allQuery
     * The text query to send to the server to return all records for the list with no filtering
     */
    allQuery: '',

    /**
     * @cfg {String} queryParam
     * Name of the parameter used by the Store to pass the typed string when the ComboBox is configured with
     * `{@link #queryMode}: 'remote'`. If explicitly set to a falsy value it will not be sent.
     */
    queryParam: 'query',

    /**
     * @cfg {String} queryMode
     * The mode in which the ComboBox uses the configured Store. Acceptable values are:
     *
     *   - **`'remote'`** :
     *
     *     In `queryMode: 'remote'`, the ComboBox loads its Store dynamically based upon user interaction.
     *
     *     This is typically used for "autocomplete" type inputs, and after the user finishes typing, the Store is {@link
     *     Ext.data.Store#method-load load}ed.
     *
     *     A parameter containing the typed string is sent in the load request. The default parameter name for the input
     *     string is `query`, but this can be configured using the {@link #queryParam} config.
     *
     *     In `queryMode: 'remote'`, the Store may be configured with `{@link Ext.data.Store#remoteFilter remoteFilter}:
     *     true`, and further filters may be _programatically_ added to the Store which are then passed with every load
     *     request which allows the server to further refine the returned dataset.
     *
     *     Typically, in an autocomplete situation, {@link #hideTrigger} is configured `true` because it has no meaning for
     *     autocomplete.
     *
     *   - **`'local'`** :
     *
     *     ComboBox loads local data
     *
     *         var combo = new Ext.form.field.ComboBox({
     *             renderTo: document.body,
     *             queryMode: 'local',
     *             store: new Ext.data.ArrayStore({
     *                 id: 0,
     *                 fields: [
     *                     'myId',  // numeric value is the key
     *                     'displayText'
     *                 ],
     *                 data: [[1, 'item1'], [2, 'item2']]  // data is local
     *             }),
     *             valueField: 'myId',
     *             displayField: 'displayText',
     *             triggerAction: 'all'
     *         });
     */
    queryMode: 'remote',

    /**
     * @cfg {Boolean} [queryCaching=true]
     * When true, this prevents the combo from re-querying (either locally or remotely) when the current query
     * is the same as the previous query.
     */
    queryCaching: true,

    /**
     * @cfg {Number} pageSize
     * If greater than `0`, a {@link Ext.toolbar.Paging} is displayed in the footer of the dropdown list and the
     * {@link #doQuery filter queries} will execute with page start and {@link Ext.view.BoundList#pageSize limit}
     * parameters. Only applies when `{@link #queryMode} = 'remote'`.
     */
    pageSize: 0,

    /**
     * @cfg {Number} queryDelay
     * The length of time in milliseconds to delay between the start of typing and sending the query to filter the
     * dropdown list.
     *
     * Defaults to `500` if `{@link #queryMode} = 'remote'` or `10` if `{@link #queryMode} = 'local'`
     */

    /**
     * @cfg {Number} minChars
     * The minimum number of characters the user must type before autocomplete and {@link #typeAhead} activate.
     *
     * Defaults to `4` if `{@link #queryMode} = 'remote'` or `0` if `{@link #queryMode} = 'local'`,
     * does not apply if `{@link Ext.form.field.Trigger#editable editable} = false`.
     */

    /**
     * @cfg {Boolean} [anyMatch=false]
     * Configure as `true` to allow match the typed characters at any position in the {@link #valueField}'s value.
     */
    anyMatch: false,

    /**
     * @cfg {Boolean} [caseSensitive=false]
     * Configure as `true` to make the filtering match with exact case matching
     */
    caseSensitive: false,

    /**
     * @cfg {Boolean} autoSelect
     * `true` to automatically highlight the first result gathered by the data store in the dropdown list when it is
     * opened. A false value would cause nothing in the list to be highlighted automatically, so
     * the user would have to manually highlight an item before pressing the enter or {@link #selectOnTab tab} key to
     * select it (unless the value of ({@link #typeAhead}) were true), or use the mouse to select a value.
     */
    autoSelect: true,

    /**
     * @cfg {Boolean} typeAhead
     * `true` to populate and autoselect the remainder of the text being typed after a configurable delay
     * ({@link #typeAheadDelay}) if it matches a known value.
     */
    typeAhead: false,

    /**
     * @cfg {Number} typeAheadDelay
     * The length of time in milliseconds to wait until the typeahead text is displayed if `{@link #typeAhead} = true`
     */
    typeAheadDelay: 250,

    /**
     * @cfg {Boolean} selectOnTab
     * Whether the Tab key should select the currently highlighted item.
     */
    selectOnTab: true,

    /**
     * @cfg {Boolean} forceSelection
     * `true` to restrict the selected value to one of the values in the list, `false` to allow the user to set
     * arbitrary text into the field.
     */
    forceSelection: false,

    /**
     * @cfg {Boolean} growToLongestValue
     * `false` to not allow the component to resize itself when its data changes
     * (and its {@link #grow} property is `true`)
     */
    growToLongestValue: true,
    
    /**
     * @cfg {Boolean} enableRegEx
     * *When {@link #queryMode} is `'local'` only*
     *
     * Set to `true` to have the ComboBox use the typed value as a RegExp source to filter the store to get possible matches.
     */

    /**
     * @cfg {String} valueNotFoundText
     * When using a name/value combo, if the value passed to setValue is not found in the store, valueNotFoundText will
     * be displayed as the field text if defined. If this default text is used, it means there
     * is no value set and no validation will occur on this field.
     */

    /**
     * @property {String} lastQuery
     * The value of the match string used to filter the store. Delete this property to force a requery. Example use:
     *
     *     var combo = new Ext.form.field.ComboBox({
     *         ...
     *         queryMode: 'remote',
     *         listeners: {
     *             // delete the previous query in the beforequery event or set
     *             // combo.lastQuery = null (this will reload the store the next time it expands)
     *             beforequery: function(qe){
     *                 delete qe.combo.lastQuery;
     *             }
     *         }
     *     });
     *
     * To make sure the filter in the store is not cleared the first time the ComboBox trigger is used configure the
     * combo with `lastQuery=''`. Example use:
     *
     *     var combo = new Ext.form.field.ComboBox({
     *         ...
     *         queryMode: 'local',
     *         triggerAction: 'all',
     *         lastQuery: ''
     *     });
     */

    /**
     * @cfg {Object} defaultListConfig
     * Set of options that will be used as defaults for the user-configured {@link #listConfig} object.
     */
    defaultListConfig: {
        loadingHeight: 70,
        minWidth: 70,
        maxHeight: 300,
        shadow: 'sides'
    },

    /**
     * @cfg {String/HTMLElement/Ext.Element} transform
     * The id, DOM node or {@link Ext.Element} of an existing HTML `<select>` element to convert into a ComboBox. The
     * target select's options will be used to build the options in the ComboBox dropdown; a configured {@link #store}
     * will take precedence over this.
     */

    /**
     * @cfg {Object} listConfig
     * An optional set of configuration properties that will be passed to the {@link Ext.view.BoundList}'s constructor.
     * Any configuration that is valid for BoundList can be included. Some of the more useful ones are:
     *
     *   - {@link Ext.view.BoundList#cls cls} - defaults to empty
     *   - {@link Ext.view.BoundList#emptyText emptyText} - defaults to empty string
     *   - {@link Ext.view.BoundList#itemSelector itemSelector} - defaults to the value defined in BoundList
     *   - {@link Ext.view.BoundList#loadingText loadingText} - defaults to `'Loading...'`
     *   - {@link Ext.view.BoundList#minWidth minWidth} - defaults to `70`
     *   - {@link Ext.view.BoundList#maxWidth maxWidth} - defaults to `undefined`
     *   - {@link Ext.view.BoundList#maxHeight maxHeight} - defaults to `300`
     *   - {@link Ext.view.BoundList#resizable resizable} - defaults to `false`
     *   - {@link Ext.view.BoundList#shadow shadow} - defaults to `'sides'`
     *   - {@link Ext.view.BoundList#width width} - defaults to `undefined` (automatically set to the width of the ComboBox
     *     field if {@link #matchFieldWidth} is true)
     *     {@link Ext.view.BoundList#getInnerTpl getInnerTpl} A function which returns a template string which renders
     *     the ComboBox's {@link #displayField} value in the dropdown. This defaults to just outputting the raw value,
     *     but may use any {@link Ext.XTemplate XTemplate} methods to produce output.
     *     
     *     The running template is configured with some extra properties that provide some context:
     *         - field {@link Ext.form.field.ComboBox ComboBox} This combobox
     *         - store {@link Ext.data.Store Store} This combobox's data store
     */

    //private
    ignoreSelection: 0,

    //private, tells the layout to recalculate its startingWidth when a record is removed from its bound store
    removingRecords: null,

    //private helper
    resizeComboToGrow: function () {
        var me = this;
        return me.grow && me.growToLongestValue;
    },

    initComponent: function() {
        var me = this,
            isDefined = Ext.isDefined,
            store = me.store,
            transform = me.transform,
            transformSelect, isLocalMode;

        Ext.applyIf(me.renderSelectors, {
            hiddenDataEl: '.' + me.hiddenDataCls.split(' ').join('.')
        });
        

        this.addEvents(
            /**
             * @event beforequery
             * Fires before all queries are processed. Return false to cancel the query or set the queryPlan's cancel
             * property to true.
             *
             * @param {Object} queryPlan An object containing details about the query to be executed.
             * @param {Ext.form.field.ComboBox} queryPlan.combo A reference to this ComboBox.
             * @param {String} queryPlan.query The query value to be used to match against the ComboBox's {@link #valueField}.
             * @param {Boolean} queryPlan.forceAll If `true`, causes the query to be executed even if the minChars threshold is not met.
             * @param {Boolean} queryPlan.cancel A boolean value which, if set to `true` upon return, causes the query not to be executed.
             * @param {Boolean} queryPlan.rawQuery If `true` indicates that the raw input field value is being used, and upon store load,
             */
            'beforequery',

            /**
             * @event select
             * Fires when at least one list item is selected.
             * @param {Ext.form.field.ComboBox} combo This combo box
             * @param {Array} records The selected records
             */
            'select',

            /**
             * @event beforeselect
             * Fires before the selected item is added to the collection
             * @param {Ext.form.field.ComboBox} combo This combo box
             * @param {Ext.data.Record} record The selected record
             * @param {Number} index The index of the selected record
             */
            'beforeselect',

            /**
             * @event beforedeselect
             * Fires before the deselected item is removed from the collection
             * @param {Ext.form.field.ComboBox} combo This combo box
             * @param {Ext.data.Record} record The deselected record
             * @param {Number} index The index of the deselected record
             */
            'beforedeselect'
        );

        // Build store from 'transform' HTML select element's options
        if (transform) {
            transformSelect = Ext.getDom(transform);
            if (transformSelect) {
                if (!me.store) {
                    store = Ext.Array.map(Ext.Array.from(transformSelect.options), function(option){
                        return [option.value, option.text];
                    });
                }
                if (!me.name) {
                    me.name = transformSelect.name;
                }
                if (!('value' in me)) {
                    me.value = transformSelect.value;
                }
            }
        }

        me.bindStore(store || 'ext-empty-store', true);
        store = me.store;
        if (store.autoCreated) {
            me.queryMode = 'local';
            me.valueField = me.displayField = 'field1';
            if (!store.expanded) {
                me.displayField = 'field2';
            }
        }

        if (!isDefined(me.valueField)) {
            me.valueField = me.displayField;
        }

        isLocalMode = me.queryMode === 'local';
        if (!isDefined(me.queryDelay)) {
            me.queryDelay = isLocalMode ? 10 : 500;
        }
        if (!isDefined(me.minChars)) {
            me.minChars = isLocalMode ? 0 : 4;
        }

        if (!me.displayTpl) {
            me.displayTpl = new Ext.XTemplate(
                '<tpl for=".">' +
                    '{[typeof values === "string" ? values : values["' + me.displayField + '"]]}' +
                    '<tpl if="xindex < xcount">' + me.delimiter + '</tpl>' +
                '</tpl>'
            );
        } else if (Ext.isString(me.displayTpl)) {
            me.displayTpl = new Ext.XTemplate(me.displayTpl);
        }

        me.callParent();

        me.doQueryTask = new Ext.util.DelayedTask(me.doRawQuery, me);

        // store has already been loaded, setValue
        if (me.store.getCount() > 0) {
            me.setValue(me.value);
        }

        // render in place of 'transform' select
        if (transformSelect) {
            me.render(transformSelect.parentNode, transformSelect);
            Ext.removeNode(transformSelect);
            delete me.renderTo;
        }
    },

    /**
     * Returns the store associated with this ComboBox.
     * @return {Ext.data.Store} The store
     */
    getStore : function(){
        return this.store;
    },

    beforeBlur: function() {
        this.doQueryTask.cancel();
        this.assertValue();
    },

    // private
    assertValue: function() {
        var me = this,
            value = me.getRawValue(),
            rec, currentValue;

        if (me.forceSelection) {
            if (me.multiSelect) {
                // For multiselect, check that the current displayed value matches the current
                // selection, if it does not then revert to the most recent selection.
                if (value !== me.getDisplayValue()) {
                    me.setValue(me.lastSelection);
                }
            } else {
                // For single-select, match the displayed value to a record and select it,
                // if it does not match a record then revert to the most recent selection.
                rec = me.findRecordByDisplay(value);
                if (rec) {
                    currentValue = me.value;
                    // Prevent an issue where we have duplicate display values with
                    // different underlying values.
                    if (!me.findRecordByValue(currentValue)) {
                        me.select(rec, true);
                    }
                } else {
                    me.setValue(me.lastSelection);
                }
            }
        }
        me.collapse();
    },

    onTypeAhead: function() {
        var me = this,
            displayField = me.displayField,
            record = me.store.findRecord(displayField, me.getRawValue()),
            boundList = me.getPicker(),
            newValue, len, selStart;

        if (record) {
            newValue = record.get(displayField);
            len = newValue.length;
            selStart = me.getRawValue().length;

            boundList.highlightItem(boundList.getNode(record));

            if (selStart !== 0 && selStart !== len) {
                me.setRawValue(newValue);
                me.selectText(selStart, newValue.length);
            }
        }
    },

    // invoked when a different store is bound to this combo
    // than the original
    resetToDefault: Ext.emptyFn,

    beforeReset: function() {
        this.callParent();

        // If filtered on typed value, unfilter.
        if (this.queryFilter && !this.queryFilter.disabled) {
            this.queryFilter.disabled = true;
            this.store.filter();
        }
    },

    onUnbindStore: function(store) {
        var me = this,
            picker = me.picker;

        // If we'd added a local filter, remove it
        if (me.queryFilter) {
            me.store.removeFilter(me.queryFilter);
        }
        if (!store && picker) {
            picker.bindStore(null);
        }
    },

    onBindStore: function(store, initial) {
        var picker = this.picker;
        if (!initial) {
            this.resetToDefault();
        }

        if (picker) {
            picker.bindStore(store);
        }
    },

    getStoreListeners: function() {
        var me = this;

        return {
            beforeload: me.onBeforeLoad,
            clear: me.onClear,
            datachanged: me.onDataChanged,
            load: me.onLoad,
            exception: me.onException,
            remove: me.onRemove
        }; 
    },

    onBeforeLoad: function(){
        // If we're remote loading, the load mask will show which will trigger a deslectAll.
        // This selection change will trigger the collapse in onListSelectionChange. As such
        // we'll veto it for now and restore selection listeners when we've loaded.
        ++this.ignoreSelection;    
    },

    onDataChanged: function() {
        var me = this;

        if (me.resizeComboToGrow()) {
            me.updateLayout();
        }
    },

    onClear: function() {
        var me = this;

        if (me.resizeComboToGrow()) {
            me.removingRecords = true;
            me.onDataChanged();
        }
    },

    onRemove: function() {
        var me = this;

        if (me.resizeComboToGrow()) {
            me.removingRecords = true;
        }
    },

    onException: function(){
        if (this.ignoreSelection > 0) {
            --this.ignoreSelection;
        }
        this.collapse();    
    },

    onLoad: function(store, records, success) {
        var me = this;

        if (me.ignoreSelection > 0) {
            --me.ignoreSelection;
        }

        // If not querying using the raw field value, we can set the value now we have data
        if (success && !store.lastOptions.rawQuery) {
            // Set the value on load

            // There's no value.
            if (me.value == null) {
                // Highlight the first item in the list if autoSelect: true
                if (me.store.getCount()) {
                    me.doAutoSelect();
                } else {
                    // assign whatever empty value we have to prevent change from firing
                    me.setValue(me.value);
                }
            } else {
                me.setValue(me.value);
            }
        }
    },

    /**
     * @private
     * Execute the query with the raw contents within the textfield.
     */
    doRawQuery: function() {
        this.doQuery(this.getRawValue(), false, true);
    },

    /**
     * Executes a query to filter the dropdown list. Fires the {@link #beforequery} event prior to performing the query
     * allowing the query action to be canceled if needed.
     *
     * @param {String} queryString The string to use to filter available items by matching against the configured {@link #valueField}.
     * @param {Boolean} [forceAll=false] `true` to force the query to execute even if there are currently fewer characters in
     * the field than the minimum specified by the `{@link #minChars}` config option. It also clears any filter
     * previously saved in the current store.
     * @param {Boolean} [rawQuery=false] Pass as true if the raw typed value is being used as the query string. This causes the
     * resulting store load to leave the raw value undisturbed.
     * @return {Boolean} true if the query was permitted to run, false if it was cancelled by a {@link #beforequery}
     * handler.
     */
    doQuery: function(queryString, forceAll, rawQuery) {
        var me = this,

            // Decide if, and how we are going to query the store
            queryPlan = me.beforeQuery({
                query: queryString || '',
                rawQuery: rawQuery,
                forceAll: forceAll,
                combo: me,
                cancel: false
            });

        // Allow veto.
        if (queryPlan === false || queryPlan.cancel) {
            return false;
        }

        // If they're using the same value as last time, just show the dropdown
        if (me.queryCaching && queryPlan.query === me.lastQuery) {
            me.expand();
        }
        
        // Otherwise filter or load the store
        else {
            me.lastQuery = queryPlan.query;

            if (me.queryMode === 'local') {
                me.doLocalQuery(queryPlan);

            } else {
                me.doRemoteQuery(queryPlan);
            }
        }

        return true;
    },

    /**
     * @template
     * A method which may modify aspects of how the store is to be filtered (if {@link #queryMode} is `"local"`)
     * of loaded (if {@link #queryMode} is `"remote"`).
     *
     * This is called by the {@link #doQuery method, and may be overridden in subclasses to modify
     * the default behaviour.
     *
     * This method is passed an object containing information about the upcoming query operation which it may modify
     * before returning.
     *
     * @param {Object} queryPlan An object containing details about the query to be executed.
     * @param {String} queryPlan.query The query value to be used to match against the ComboBox's {@link #valueField}.
     * @param {Boolean} queryPlan.forceAll If `true`, causes the query to be executed even if the minChars threshold is not met.
     * @param {Boolean} queryPlan.cancel A boolean value which, if set to `true` upon return, causes the query not to be executed.
     * @param {Boolean} queryPlan.rawQuery If `true` indicates that the raw input field value is being used, and upon store load,
     * the input field value should **not** be overwritten.
     *
     */
    beforeQuery: function(queryPlan) {
        var me = this;

        // Allow beforequery event to veto by returning false
        if (me.fireEvent('beforequery', queryPlan) === false) {
            queryPlan.cancel = true;
        }

        // Allow beforequery event to veto by returning setting the cancel flag
        else if (!queryPlan.cancel) {

            // If the minChars threshold has not been met, and we're not forcing an "all" query, cancel the query
            if (queryPlan.query.length < me.minChars && !queryPlan.forceAll) {
                queryPlan.cancel = true;
            }
        }
        return queryPlan;
    },

    doLocalQuery: function(queryPlan) {
        var me = this,
            queryString = queryPlan.query;

        // Create our filter when first needed
        if (!me.queryFilter) {
            // Create the filter that we will use during typing to filter the Store
            me.queryFilter = new Ext.util.Filter({
                id: me.id + '-query-filter',
                anyMatch: me.anyMatch,
                caseSensitive: me.caseSensitive,
                root: 'data',
                property: me.displayField
            });
            me.store.addFilter(me.queryFilter, false);
        }

        // Querying by a string...
        if (queryString || !queryPlan.forceAll) {
            me.queryFilter.disabled = false;
            me.queryFilter.setValue(me.enableRegEx ? new RegExp(queryString) : queryString);
        }

        // If forceAll being used, or no query string, disable the filter
        else {
            me.queryFilter.disabled = true;
        }

        // Filter the Store according to the updated filter
        me.store.filter();

        // Expand after adjusting the filter unless there are no matches
        if (me.store.getCount()) {
            me.expand();
        } else {
            me.collapse();
        }

        me.afterQuery(queryPlan);
    },

    doRemoteQuery: function(queryPlan) {
        var me = this,
            loadCallback = function() {
                me.afterQuery(queryPlan);
            };

        // expand before loading so LoadMask can position itself correctly
        me.expand();

        // In queryMode: 'remote', we assume Store filters are added by the developer as remote filters,
        // and these are automatically passed as params with every load call, so we do *not* call clearFilter.
        if (me.pageSize) {
            // if we're paging, we've changed the query so start at page 1.
            me.loadPage(1, {
                rawQuery: queryPlan.rawQuery,
                callback: loadCallback
            });
        } else {
            me.store.load({
                params: me.getParams(queryPlan.query),
                rawQuery: queryPlan.rawQuery,
                callback: loadCallback
            });
        }
    },

    /**
     * @template
     * A method called when the filtering caused by the {@link #doQuery} call is complete and the store has been
     * either filtered locally (if {@link #queryMode} is `"local"`), or has been loaded using the specified filtering.
     *
     * @param {Object} queryPlan An object containing details about the query was executed.
     * @param {String} queryPlan.query The query value to be used to match against the ComboBox's {@link #valueField}.
     * @param {Boolean} queryPlan.forceAll If `true`, causes the query to be executed even if the minChars threshold is not met.
     * @param {Boolean} queryPlan.cancel A boolean value which, if set to `true` upon return, causes the query not to be executed.
     * @param {Boolean} queryPlan.rawQuery If `true` indicates that the raw input field value is being used, and upon store load,
     * the input field value should **not** be overwritten.
     * 
     */
    afterQuery: function(queryPlan) {
        var me = this;

        if (me.store.getCount()) {
            if (me.typeAhead) {
                me.doTypeAhead();
            }

            // Clear current selection if it does not match the current value in the field
            if (me.getRawValue() !== me.getDisplayValue()) {
                me.ignoreSelection++;
                me.picker.getSelectionModel().deselectAll();
                me.ignoreSelection--;
            }

            if (queryPlan.rawQuery) {
                me.syncSelection();
                if (me.picker && !me.picker.getSelectionModel().hasSelection()) {
                    me.doAutoSelect();
                }
            } else {
                me.doAutoSelect();
            }
        }
    },

    loadPage: function(pageNum, options) {
        this.store.loadPage(pageNum, Ext.apply({
            params: this.getParams(this.lastQuery)
        }, options));
    },

    onPageChange: function(toolbar, newPage){
        /*
         * Return false here so we can call load ourselves and inject the query param.
         * We don't want to do this for every store load since the developer may load
         * the store through some other means so we won't add the query param.
         */
        this.loadPage(newPage);
        return false;
    },

    // private
    getParams: function(queryString) {
        var params = {},
            param = this.queryParam;

        if (param) {
            params[param] = queryString;
        }
        return params;
    },

    /**
     * @private
     * If the autoSelect config is true, and the picker is open, highlights the first item.
     */
    doAutoSelect: function() {
        var me = this,
            picker = me.picker,
            lastSelected, itemNode;
        if (picker && me.autoSelect && me.store.getCount() > 0) {
            // Highlight the last selected item and scroll it into view
            lastSelected = picker.getSelectionModel().lastSelected;
            itemNode = picker.getNode(lastSelected || 0);
            if (itemNode) {
                picker.highlightItem(itemNode);
                picker.listEl.scrollChildIntoView(itemNode, false);
            }
        }
    },

    doTypeAhead: function() {
        if (!this.typeAheadTask) {
            this.typeAheadTask = new Ext.util.DelayedTask(this.onTypeAhead, this);
        }
        if (this.lastKey != Ext.EventObject.BACKSPACE && this.lastKey != Ext.EventObject.DELETE) {
            this.typeAheadTask.delay(this.typeAheadDelay);
        }
    },

    onTriggerClick: function() {
        var me = this;
        if (!me.readOnly && !me.disabled) {
            if (me.isExpanded) {
                me.collapse();
            } else {
                me.onFocus({});
                if (me.triggerAction === 'all') {
                    me.doQuery(me.allQuery, true);
                } else if (me.triggerAction === 'last') {
                    me.doQuery(me.lastQuery, true);
                } else {
                    me.doQuery(me.getRawValue(), false, true);
                }
            }
            me.inputEl.focus();
        }
    },

    onPaste: function(){
        var me = this;
        
        if (!me.readOnly && !me.disabled && me.editable) {
            me.doQueryTask.delay(me.queryDelay);
        }
    },

    // store the last key and doQuery if relevant
    onKeyUp: function(e, t) {
        var me = this,
            key = e.getKey();

        if (!me.readOnly && !me.disabled && me.editable) {
            me.lastKey = key;
            // we put this in a task so that we can cancel it if a user is
            // in and out before the queryDelay elapses

            // perform query w/ any normal key or backspace or delete
            if (!e.isSpecialKey() || key == e.BACKSPACE || key == e.DELETE) {
                me.doQueryTask.delay(me.queryDelay);
            }
        }

        if (me.enableKeyEvents) {
            me.callParent(arguments);
        }
    },

    initEvents: function() {
        var me = this;
        me.callParent();

        /*
         * Setup keyboard handling. If enableKeyEvents is true, we already have
         * a listener on the inputEl for keyup, so don't create a second.
         */
        if (!me.enableKeyEvents) {
            me.mon(me.inputEl, 'keyup', me.onKeyUp, me);
        }
        me.mon(me.inputEl, 'paste', me.onPaste, me);
    },

    onDestroy: function() {
        Ext.destroy(this.listKeyNav);
        this.bindStore(null);
        this.callParent();
    },

    // The picker (the dropdown) must have its zIndex managed by the same ZIndexManager which is
    // providing the zIndex of our Container.
    onAdded: function() {
        var me = this;
        me.callParent(arguments);
        if (me.picker) {
            me.picker.ownerCt = me.up('[floating]');
            me.picker.registerWithOwnerCt();
        }
    },

    createPicker: function() {
        var me = this,
            picker,
            pickerCfg = Ext.apply({
                xtype: 'boundlist',
                pickerField: me,
                selModel: {
                    mode: me.multiSelect ? 'SIMPLE' : 'SINGLE'
                },
                floating: true,
                hidden: true,
                store: me.store,
                displayField: me.displayField,
                focusOnToFront: false,
                pageSize: me.pageSize,
                tpl: me.tpl
            }, me.listConfig, me.defaultListConfig);

        picker = me.picker = Ext.widget(pickerCfg);
        if (me.pageSize) {
            picker.pagingToolbar.on('beforechange', me.onPageChange, me);
        }

        me.mon(picker, {
            itemclick: me.onItemClick,
            refresh: me.onListRefresh,
            scope: me
        });

        me.mon(picker.getSelectionModel(), {
            beforeselect: me.onBeforeSelect,
            beforedeselect: me.onBeforeDeselect,
            selectionchange: me.onListSelectionChange,
            scope: me
        });

        return picker;
    },

    alignPicker: function(){
        var me = this,
            picker = me.getPicker(),
            heightAbove = me.getPosition()[1] - Ext.getBody().getScroll().top,
            heightBelow = Ext.Element.getViewHeight() - heightAbove - me.getHeight(),
            space = Math.max(heightAbove, heightBelow);

        // Allow the picker to height itself naturally.
        if (picker.height) {
            delete picker.height;
            picker.updateLayout();
        }
        // Then ensure that vertically, the dropdown will fit into the space either above or below the inputEl.
        if (picker.getHeight() > space - 5) {
            picker.setHeight(space - 5); // have some leeway so we aren't flush against
        }
        me.callParent();
    },

    onListRefresh: function() {
        // Picker will be aligned during the expand call
        if (!this.expanding) {
            this.alignPicker();
        }
        this.syncSelection();
    },

    onItemClick: function(picker, record){
        /*
         * If we're doing single selection, the selection change events won't fire when
         * clicking on the selected element. Detect it here.
         */
        var me = this,
            selection = me.picker.getSelectionModel().getSelection(),
            valueField = me.valueField;

        if (!me.multiSelect && selection.length) {
            if (record.get(valueField) === selection[0].get(valueField)) {
                // Make sure we also update the display value if it's only partial
                me.displayTplData = [record.data];
                me.setRawValue(me.getDisplayValue());
                me.collapse();
            }
        }
    },

    onBeforeSelect: function(list, record) {
        return this.fireEvent('beforeselect', this, record, record.index);
    },

    onBeforeDeselect: function(list, record) {
        return this.fireEvent('beforedeselect', this, record, record.index);
    },

    onListSelectionChange: function(list, selectedRecords) {
        var me = this,
            isMulti = me.multiSelect,
            hasRecords = selectedRecords.length > 0;
        // Only react to selection if it is not called from setValue, and if our list is
        // expanded (ignores changes to the selection model triggered elsewhere)
        if (!me.ignoreSelection && me.isExpanded) {
            if (!isMulti) {
                Ext.defer(me.collapse, 1, me);
            }
            /*
             * Only set the value here if we're in multi selection mode or we have
             * a selection. Otherwise setValue will be called with an empty value
             * which will cause the change event to fire twice.
             */
            if (isMulti || hasRecords) {
                me.setValue(selectedRecords, false);
            }
            if (hasRecords) {
                me.fireEvent('select', me, selectedRecords);
            }
            me.inputEl.focus();
        }
    },

    /**
     * @private
     * Enables the key nav for the BoundList when it is expanded.
     */
    onExpand: function() {
        var me = this,
            keyNav = me.listKeyNav,
            selectOnTab = me.selectOnTab,
            picker = me.getPicker();

        // Handle BoundList navigation from the input field. Insert a tab listener specially to enable selectOnTab.
        if (keyNav) {
            keyNav.enable();
        } else {
            keyNav = me.listKeyNav = new Ext.view.BoundListKeyNav(this.inputEl, {
                boundList: picker,
                forceKeyDown: true,
                tab: function(e) {
                    if (selectOnTab) {
                        this.selectHighlighted(e);
                        me.triggerBlur();
                    }
                    // Tab key event is allowed to propagate to field
                    return true;
                },
                enter: function(e){
                    var selModel = picker.getSelectionModel(),
                        count = selModel.getCount();
                        
                    this.selectHighlighted(e);
                    
                    // Handle the case where the highlighted item is already selected
                    // In this case, the change event won't fire, so just collapse
                    if (!me.multiSelect && count === selModel.getCount()) {
                        me.collapse();
                    }
                }
            });
        }

        // While list is expanded, stop tab monitoring from Ext.form.field.Trigger so it doesn't short-circuit selectOnTab
        if (selectOnTab) {
            me.ignoreMonitorTab = true;
        }

        Ext.defer(keyNav.enable, 1, keyNav); //wait a bit so it doesn't react to the down arrow opening the picker
        me.inputEl.focus();
    },

    /**
     * @private
     * Disables the key nav for the BoundList when it is collapsed.
     */
    onCollapse: function() {
        var me = this,
            keyNav = me.listKeyNav;
        if (keyNav) {
            keyNav.disable();
            me.ignoreMonitorTab = false;
        }
    },

    /**
     * Selects an item by a {@link Ext.data.Model Model}, or by a key value.
     * @param {Object} r
     */
    select: function(r, /* private */ assert) {
        var me = this,
            picker = me.picker,
            doSelect = true,
            fireSelect;
        
        if (r && r.isModel && assert === true && picker) {
            fireSelect = !picker.getSelectionModel().isSelected(r);
        }
        
        me.setValue(r, true);
        // Select needs to be fired after setValue, so that when we call getValue
        // in select it returns the correct value
        if (fireSelect) {
            me.fireEvent('select', me, r);
        }
    },

    /**
     * Finds the record by searching for a specific field/value combination.
     * @param {String} field The name of the field to test.
     * @param {Object} value The value to match the field against.
     * @return {Ext.data.Model} The matched record or false.
     */
    findRecord: function(field, value) {
        var ds = this.store,
            idx = ds.findExact(field, value);
        return idx !== -1 ? ds.getAt(idx) : false;
    },

    /**
     * Finds the record by searching values in the {@link #valueField}.
     * @param {Object} value The value to match the field against.
     * @return {Ext.data.Model} The matched record or false.
     */
    findRecordByValue: function(value) {
        return this.findRecord(this.valueField, value);
    },

    /**
     * Finds the record by searching values in the {@link #displayField}.
     * @param {Object} value The value to match the field against.
     * @return {Ext.data.Model} The matched record or false.
     */
    findRecordByDisplay: function(value) {
        return this.findRecord(this.displayField, value);
    },

    /**
     * Sets the specified value(s) into the field. For each value, if a record is found in the {@link #store} that
     * matches based on the {@link #valueField}, then that record's {@link #displayField} will be displayed in the
     * field. If no match is found, and the {@link #valueNotFoundText} config option is defined, then that will be
     * displayed as the default field text. Otherwise a blank value will be shown, although the value will still be set.
     * @param {String/String[]} value The value(s) to be set. Can be either a single String or {@link Ext.data.Model},
     * or an Array of Strings or Models.
     * @return {Ext.form.field.Field} this
     */
    setValue: function(value, doSelect) {
        var me = this,
            valueNotFoundText = me.valueNotFoundText,
            inputEl = me.inputEl,
            i, len, record,
            dataObj,
            matchedRecords = [],
            displayTplData = [],
            processedValue = [];

        if (me.store.loading) {
            // Called while the Store is loading. Ensure it is processed by the onLoad method.
            me.value = value;
            me.setHiddenValue(me.value);
            return me;
        }

        // This method processes multi-values, so ensure value is an array.
        value = Ext.Array.from(value);

        // Loop through values, matching each from the Store, and collecting matched records
        for (i = 0, len = value.length; i < len; i++) {
            record = value[i];
            if (!record || !record.isModel) {
                record = me.findRecordByValue(record);
            }
            // record found, select it.
            if (record) {
                matchedRecords.push(record);
                displayTplData.push(record.data);
                processedValue.push(record.get(me.valueField));
            }
            // record was not found, this could happen because
            // store is not loaded or they set a value not in the store
            else {
                // If we are allowing insertion of values not represented in the Store, then push the value and
                // create a fake record data object to push as a display value for use by the displayTpl
                if (!me.forceSelection) {
                    processedValue.push(value[i]);
                    dataObj = {};
                    dataObj[me.displayField] = value[i];
                    displayTplData.push(dataObj);
                    // TODO: Add config to create new records on selection of a value that has no match in the Store
                }
                // Else, if valueNotFoundText is defined, display it, otherwise display nothing for this value
                else if (Ext.isDefined(valueNotFoundText)) {
                    displayTplData.push(valueNotFoundText);
                }
            }
        }

        // Set the value of this field. If we are multiselecting, then that is an array.
        me.setHiddenValue(processedValue);
        me.value = me.multiSelect ? processedValue : processedValue[0];
        if (!Ext.isDefined(me.value)) {
            me.value = null;
        }
        me.displayTplData = displayTplData; //store for getDisplayValue method
        me.lastSelection = me.valueModels = matchedRecords;

        if (inputEl && me.emptyText && !Ext.isEmpty(value)) {
            inputEl.removeCls(me.emptyCls);
        }

        // Calculate raw value from the collection of Model data
        me.setRawValue(me.getDisplayValue());
        me.checkChange();

        if (doSelect !== false) {
            me.syncSelection();
        }
        me.applyEmptyText();

        return me;
    },

    /**
     * @private
     * Set the value of {@link #hiddenDataEl}
     * Dynamically adds and removes input[type=hidden] elements
     */
    setHiddenValue: function(values){
        var me = this,
            name = me.hiddenName, 
            i,
            dom, childNodes, input, valueCount, childrenCount;
            
        if (!me.hiddenDataEl || !name) {
            return;
        }
        values = Ext.Array.from(values);
        dom = me.hiddenDataEl.dom;
        childNodes = dom.childNodes;
        input = childNodes[0];
        valueCount = values.length;
        childrenCount = childNodes.length;
        
        if (!input && valueCount > 0) {
            me.hiddenDataEl.update(Ext.DomHelper.markup({
                tag: 'input', 
                type: 'hidden', 
                name: name
            }));
            childrenCount = 1;
            input = dom.firstChild;
        }
        while (childrenCount > valueCount) {
            dom.removeChild(childNodes[0]);
            -- childrenCount;
        }
        while (childrenCount < valueCount) {
            dom.appendChild(input.cloneNode(true));
            ++ childrenCount;
        }
        for (i = 0; i < valueCount; i++) {
            childNodes[i].value = values[i];
        }
    },

    /**
     * @private Generates the string value to be displayed in the text field for the currently stored value
     */
    getDisplayValue: function() {
        return this.displayTpl.apply(this.displayTplData);
    },

    getValue: function() {
        // If the user has not changed the raw field value since a value was selected from the list,
        // then return the structured value from the selection. If the raw field value is different
        // than what would be displayed due to selection, return that raw value.
        var me = this,
            picker = me.picker,
            rawValue = me.getRawValue(), //current value of text field
            value = me.value; //stored value from last selection or setValue() call

        if (me.getDisplayValue() !== rawValue) {
            value = rawValue;
            me.value = me.displayTplData = me.valueModels = null;
            if (picker) {
                me.ignoreSelection++;
                picker.getSelectionModel().deselectAll();
                me.ignoreSelection--;
            }
        }

        return value;
    },

    getSubmitValue: function() {
        var value = this.getValue();
        // If the value is null/undefined, we still return an empty string. If we
        // don't, the field will never get posted to the server since nulls are ignored.
        if (Ext.isEmpty(value)) {
            value = '';
        }
        return value;
    },

    isEqual: function(v1, v2) {
        var fromArray = Ext.Array.from,
            i, len;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for(i = 0; i < len; i++) {
            if (v2[i] !== v1[i]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Clears any value currently set in the ComboBox.
     */
    clearValue: function() {
        this.setValue([]);
    },

    /**
     * @private Synchronizes the selection in the picker to match the current value of the combobox.
     */
    syncSelection: function() {
        var me = this,
            picker = me.picker,
            selection, selModel,
            values = me.valueModels || [],
            vLen  = values.length, v, value;

        if (picker) {
            // From the value, find the Models that are in the store's current data
            selection = [];
            for (v = 0; v < vLen; v++) {
                value = values[v];

                if (value && value.isModel && me.store.indexOf(value) >= 0) {
                    selection.push(value);
                }
            }

            // Update the selection to match
            me.ignoreSelection++;
            selModel = picker.getSelectionModel();
            selModel.deselectAll();
            if (selection.length) {
                selModel.select(selection, undefined, true);
            }
            me.ignoreSelection--;
        }
    },
    
    onEditorTab: function(e){
        var keyNav = this.listKeyNav;
        
        if (this.selectOnTab && keyNav) {
            keyNav.selectHighlighted(e);
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * A feature is a type of plugin that is specific to the {@link Ext.grid.Panel}. It provides several
 * hooks that allows the developer to inject additional functionality at certain points throughout the 
 * grid creation cycle. This class provides the base template methods that are available to the developer,
 * it should be extended.
 * 
 * There are several built in features that extend this class, for example:
 *
 *  - {@link Ext.grid.feature.Grouping} - Shows grid rows in groups as specified by the {@link Ext.data.Store}
 *  - {@link Ext.grid.feature.RowBody} - Adds a body section for each grid row that can contain markup.
 *  - {@link Ext.grid.feature.Summary} - Adds a summary row at the bottom of the grid with aggregate totals for a column.
 * 
 * ## Using Features
 * A feature is added to the grid by specifying it an array of features in the configuration:
 * 
 *     var groupingFeature = Ext.create('Ext.grid.feature.Grouping');
 *     Ext.create('Ext.grid.Panel', {
 *         // other options
 *         features: [groupingFeature]
 *     });
 *
 * ## Writing Features
 *
 * A Feature may add new DOM structure within the structure of a grid.
 *
 * A grid is essentially a `<table>` element. A {@link Ext.view.Table TableView} instance uses three {@link Ext.XTemplate XTemplates}
 * to render the grid, `tableTpl`, `rowTpl`, `cellTpl`.
 *
 * * A {@link Ext.view.Table TableView} uses its `tableTpl` to emit the `<table>` and `<tbody>` HTML tags into its output stream. It also emits a `<thead>` which contains a
 * sizing row. To ender the rows, it invokes {@link Ext.view.Table#renderRows} passing the `rows` member of its data object.
 *
 * The `tableTpl`'s data object Looks like this:
 *     {
 *         view: owningTableView,
 *         rows: recordsToRender,
 *         viewStartIndex: indexOfFirstRecordInStore,
 *         tableStyle: styleString
 *     }
 *
 * * A {@link Ext.view.Table TableView} uses its `rowTpl` to emit a `<tr>` HTML tag to its output stream. To render cells,
 * it invokes {@link Ext.view.Table#renderCell} passing the `rows` member of its data object.
 *
 * The `rowTpl`'s data object looks like this:
 *
 *     {
 *         view:        owningTableView,
 *         record:      recordToRender,
 *         recordIndex: indexOfRecordInStore,
 *         columns:     arrayOfColumnDefinitions,
 *         itemClasses: arrayOfClassNames, // For outermost row in case of wrapping
 *         rowClasses:  arrayOfClassNames,  // For internal data bearing row in case of wrapping
 *         rowStyle:    styleString
 *     }
 *
 * * A {@link Ext.view.Table TableView} uses its `cellTpl` to emit a `<td>` HTML tag to its output stream.
 *
 * The `cellTpl's` data object looks like this:
 *
 *     {
 *         record: recordToRender
 *         column: columnToRender;
 *         recordIndex: indexOfRecordInStore,
 *         columnIndex: columnIndex,
 *         align: columnAlign,
 *         tdCls: classForCell
 *     }
 *
 * A Feature may inject its own tableTpl or rowTpl or cellTpl into the {@link Ext.view.Table TableView}'s rendering by
 * calling {@link Ext.view.Table#addTableTpl} or {@link Ext.view.Table#addRowTpl} or {@link Ext.view.Table#addCellTpl}.
 *
 * The passed XTemplate is added *upstream* of the default template for the table element in a link list of XTemplates which contribute
 * to the element's HTML. It may emit appropriate HTML strings into the output stream *around* a call to
 *
 *     this.nextTpl.apply(values, out, parent);
 *
 * This passes the current value context, output stream and the parent value context to the next XTemplate in the list.
 *
 * @abstract
 */
Ext.define('Ext.grid.feature.Feature', {
    extend:  Ext.util.Observable ,
    alias: 'feature.feature',
    
    wrapsItem: false,

    /*
     * @property {Boolean} isFeature
     * `true` in this class to identify an object as an instantiated Feature, or subclass thereof.
     */
    isFeature: true,

    /**
     * True when feature is disabled.
     */
    disabled: false,

    /**
     * @property {Boolean}
     * Most features will expose additional events, some may not and will
     * need to change this to false.
     */
    hasFeatureEvent: true,

    /**
     * @property {String}
     * Prefix to use when firing events on the view.
     * For example a prefix of group would expose "groupclick", "groupcontextmenu", "groupdblclick".
     */
    eventPrefix: null,

    /**
     * @property {String}
     * Selector used to determine when to fire the event with the eventPrefix.
     */
    eventSelector: null,

    /**
     * @property {Ext.view.Table}
     * Reference to the TableView.
     */
    view: null,

    /**
     * @property {Ext.grid.Panel}
     * Reference to the grid panel
     */
    grid: null,
    
    constructor: function(config) {
        this.initialConfig = config;
        this.callParent(arguments);
    },

    clone: function() {
        return new this.self(this.initialConfig);
    },

    init: Ext.emptyFn,
    
    destroy: function(){
        this.clearListeners();
    },

    /**
     * Abstract method to be overriden when a feature should add additional
     * arguments to its event signature. By default the event will fire:
     *
     * - view - The underlying Ext.view.Table
     * - featureTarget - The matched element by the defined {@link #eventSelector}
     *
     * The method must also return the eventName as the first index of the array
     * to be passed to fireEvent.
     * @template
     */
    getFireEventArgs: function(eventName, view, featureTarget, e) {
        return [eventName, view, featureTarget, e];
    },
    
    vetoEvent: Ext.emptyFn,

    /**
     * Enables the feature.
     */
    enable: function() {
        this.disabled = false;
    },

    /**
     * Disables the feature.
     */
    disable: function() {
        this.disabled = true;
    }

});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * The rowbody feature enhances the grid's markup to have an additional
 * tr -> td -> div which spans the entire width of the original row.
 *
 * This is useful to to associate additional information with a particular
 * record in a grid.
 *
 * Rowbodies are initially hidden unless you override setupRowData.
 *
 * Will expose additional events on the gridview with the prefix of 'rowbody'.
 * For example: 'rowbodyclick', 'rowbodydblclick', 'rowbodycontextmenu'.
 *
 * # Example
 *
 *     @example
 *     Ext.define('Animal', {
 *         extend: 'Ext.data.Model',
 *         fields: ['name', 'latin', 'desc']
 *     });
 * 
 *     Ext.create('Ext.grid.Panel', {
 *         width: 400,
 *         height: 300,
 *         renderTo: Ext.getBody(),
 *         store: {
 *             model: 'Animal',
 *             data: [
 *                 {name: 'Tiger', latin: 'Panthera tigris',
 *                  desc: 'The largest cat species, weighing up to 306 kg (670 lb).'},
 *                 {name: 'Roman snail', latin: 'Helix pomatia',
 *                  desc: 'A species of large, edible, air-breathing land snail.'},
 *                 {name: 'Yellow-winged darter', latin: 'Sympetrum flaveolum',
 *                  desc: 'A dragonfly found in Europe and mid and Northern China.'},
 *                 {name: 'Superb Fairy-wren', latin: 'Malurus cyaneus',
 *                  desc: 'Common and familiar across south-eastern Australia.'}
 *             ]
 *         },
 *         columns: [{
 *             dataIndex: 'name',
 *             text: 'Common name',
 *             width: 125
 *         }, {
 *             dataIndex: 'latin',
 *             text: 'Scientific name',
 *             flex: 1
 *         }],
 *         features: [{
 *             ftype: 'rowbody',
 *             setupRowData: function(record, rowIndex, rowValues) {
 *                 var headerCt = this.view.headerCt,
 *                     colspan = headerCt.getColumnCount();
 *                 // Usually you would style the my-body-class in CSS file
 *                 return {
 *                     rowBody: '<div style="padding: 1em">'+record.get("desc")+'</div>',
 *                     rowBodyCls: "my-body-class",
 *                     rowBodyColspan: colspan
 *                 };
 *             }
 *         }]
 *     });
 */
Ext.define('Ext.grid.feature.RowBody', {
    extend:  Ext.grid.feature.Feature ,
    alias: 'feature.rowbody',

    rowBodyCls: Ext.baseCSSPrefix + 'grid-row-body',
    rowBodyHiddenCls: Ext.baseCSSPrefix + 'grid-row-body-hidden',
    rowBodyTdSelector: 'td.' + Ext.baseCSSPrefix + 'grid-cell-rowbody',
    eventPrefix: 'rowbody',
    eventSelector: 'tr.' + Ext.baseCSSPrefix + 'grid-rowbody-tr',

    tableTpl: {
        before: function(values, out) {
            var view = values.view,
                rowValues = view.rowValues;

            this.rowBody.setup(values.rows, rowValues);
        },
        after: function(values, out) {
            var view = values.view,
                rowValues = view.rowValues;

            this.rowBody.cleanup(values.rows, rowValues);
        },
        priority: 100
    },

    extraRowTpl: [
        '{%',
            'values.view.rowBodyFeature.setupRowData(values.record, values.recordIndex, values);',
            'this.nextTpl.applyOut(values, out, parent);',
        '%}',
        '<tr class="' + Ext.baseCSSPrefix + 'grid-rowbody-tr {rowBodyCls}">',
            '<td class="' + Ext.baseCSSPrefix + 'grid-cell-rowbody' + '" colspan="{rowBodyColspan}">',
                '<div class="' + Ext.baseCSSPrefix + 'grid-rowbody' + ' {rowBodyDivCls}">{rowBody}</div>',
            '</td>',
        '</tr>', {
            priority: 100,

            syncRowHeights: function(firstRow, secondRow) {
                var owner = this.owner,
                    firstRowBody = Ext.fly(firstRow).down(owner.eventSelector, true),
                    secondRowBody,
                    firstHeight, secondHeight;

                // Sync the heights of row body elements in each row if they need it.
                if (firstRowBody && (secondRowBody = Ext.fly(secondRow).down(owner.eventSelector, true))) {
                    if ((firstHeight = firstRowBody.offsetHeight) > (secondHeight = secondRowBody.offsetHeight)) {
                        Ext.fly(secondRowBody).setHeight(firstHeight);
                    }
                    else if (secondHeight > firstHeight) {
                        Ext.fly(firstRowBody).setHeight(secondHeight);
                    }
                }
            },

            syncContent: function(destRow, sourceRow) {
                var owner = this.owner,
                    destRowBody = Ext.fly(destRow).down(owner.eventSelector, true),
                    sourceRowBody;

                // Sync the heights of row body elements in each row if they need it.
                if (destRowBody && (sourceRowBody = Ext.fly(sourceRow).down(owner.eventSelector, true))) {
                    Ext.fly(destRowBody).syncContent(sourceRowBody);
                }
            }
        }
    ],

    init: function(grid) {
        var me = this,
            view = me.view;

        view.rowBodyFeature = me;

        // If we are not inside a wrapped row, we must listen for mousedown in the body row to trigger selection.
        // Also need to remove the body row on removing a record.
        if (!view.findFeature('rowwrap')) {
            grid.mon(view, {
                element: 'el',
                mousedown: me.onMouseDown,
                scope: me
            });
            
            me.mon(grid.getStore(), 'remove', me.onStoreRemove, me);
        }

        view.headerCt.on({
            columnschanged: me.onColumnsChanged,
            scope: me
        });
        view.addTableTpl(me.tableTpl).rowBody = me;
        view.addRowTpl(Ext.XTemplate.getTpl(this, 'extraRowTpl'));
        me.callParent(arguments);
    },
    
    onStoreRemove: function(store, model, index){
        var view = this.view,
            node;
            
        if (view.rendered) {
            node = view.getNode(index);
            if (node) {
                node = Ext.fly(node).next(this.eventSelector);
                if (node) {
                    node.remove();
                }
            }
        }
    },

    // Needed when not used inside a RowWrap to select the data row when mousedown on the body row.
    onMouseDown: function(e) {
        var me = this,
            tableRow = e.getTarget(me.eventSelector);

        // If we have mousedowned on a row body TR and its previous sibling is a grid row, pass that onto the view for processing
        if (tableRow && Ext.fly(tableRow = tableRow.previousSibling).is(me.view.getItemSelector())) {
            e.target = tableRow;
            me.view.handleEvent(e);
        }
    },

    getSelectedRow: function(view, rowIndex) {
        var selectedRow = view.getNode(rowIndex, false);
        if (selectedRow) {
            return Ext.fly(selectedRow).down(this.eventSelector);
        }
        return null;
    },

    // When columns added/removed, keep row body colspan in sync with number of columns.
    onColumnsChanged: function(headerCt) {
        var items = this.view.el.query(this.rowBodyTdSelector),
            colspan = headerCt.getVisibleGridColumns().length,
            len = items.length,
            i;

        for (i = 0; i < len; ++i) {
            items[i].colSpan = colspan;
        }
    },
    
    /**
     * @method getAdditionalData
     * Provides additional data to the prepareData call within the grid view.
     * The rowbody feature adds 3 additional variables into the grid view's template.
     * These are rowBodyCls, rowBodyColspan, and rowBody.
     * @param {Object} data The data for this particular record.
     * @param {Number} idx The row index for this record.
     * @param {Ext.data.Model} record The record instance
     * @param {Object} orig The original result from the prepareData call to massage.
     */
    setupRowData: function(record, rowIndex, rowValues) {
        if (this.getAdditionalData) {
            Ext.apply(rowValues, this.getAdditionalData(record.data, rowIndex, record, rowValues));
        }
    },

    setup: function(rows, rowValues) {
        rowValues.rowBodyCls = this.rowBodyCls;
        rowValues.rowBodyColspan = rowValues.view.getGridColumns().length;
    },

    cleanup: function(rows, rowValues) {
        rowValues.rowBodyCls = rowValues.rowBodyColspan = rowValues.rowBody = null;    
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @private
 */
Ext.define('Ext.grid.feature.RowWrap', {
    extend:  Ext.grid.feature.Feature ,
    alias: 'feature.rowwrap',
    
    rowWrapTd: 'td.' + Ext.baseCSSPrefix + 'grid-rowwrap',
    
    // turn off feature events.
    hasFeatureEvent: false,
    
    tableTpl: {
        before: function(values, out) {
            if (values.view.bufferedRenderer) {
                values.view.bufferedRenderer.variableRowHeight = true;
            }
        },
        priority: 200
    },

    wrapTpl: [
        '<tr data-boundView="{view.id}" data-recordId="{record.internalId}" data-recordIndex="{recordIndex}" class="{[values.itemClasses.join(" ")]} ' + Ext.baseCSSPrefix + 'grid-wrap-row">',
            '<td class="' + Ext.baseCSSPrefix + 'grid-rowwrap ' + Ext.baseCSSPrefix + 'grid-td" colSpan="{columns.length}">',
                '<table class="' + Ext.baseCSSPrefix + '{view.id}-table ' + Ext.baseCSSPrefix + 'grid-table" border="0" cellspacing="0" cellpadding="0">',
                    '{[values.view.renderColumnSizer(out)]}',
                    '{%',
                        'values.itemClasses.length = 0;',
                        'this.nextTpl.applyOut(values, out, parent)',
                    '%}',
                '</table>',
            '</td>',
        '</tr>', {
            priority: 200
        }
    ],

    init: function(grid) {
        var me = this;
        me.view.addTableTpl(me.tableTpl);
        me.view.addRowTpl(Ext.XTemplate.getTpl(me, 'wrapTpl'));
        me.view.headerCt.on({
            columnhide: me.onColumnHideShow,
            columnshow: me.onColumnHideShow,
            scope: me
        });
    },

    // Keep row wtap colspan in sync with number of *visible* columns.
    onColumnHideShow: function() {
        var view = this.view,
            items = view.el.query(this.rowWrapTd),
            colspan = view.headerCt.getVisibleGridColumns().length,
            len = items.length,
            i;
            
        for (i = 0; i < len; ++i) {
            items[i].colSpan = colspan;
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This class functions **between siblings of a {@link Ext.layout.container.VBox VBox} or {@link Ext.layout.container.HBox HBox}
 * layout** to resize both immediate siblings.
 *
 * A Splitter will preserve the flex ratio of any flexed siblings it is required to resize. It does this by setting the `flex` property of *all* flexed siblings
 * to equal their pixel size. The actual numerical `flex` property in the Components will change, but the **ratio** to the total flex value will be preserved.
 *
 * A Splitter may be configured to show a centered mini-collapse tool orientated to collapse the {@link #collapseTarget}.
 * The Splitter will then call that sibling Panel's {@link Ext.panel.Panel#method-collapse collapse} or {@link Ext.panel.Panel#method-expand expand} method
 * to perform the appropriate operation (depending on the sibling collapse state). To create the mini-collapse tool but take care
 * of collapsing yourself, configure the splitter with `{@link #performCollapse}: false`.
 */
Ext.define('Ext.resizer.Splitter', {
    extend:  Ext.Component ,
                                
                                          
    alias: 'widget.splitter',

    childEls: [
        'collapseEl'
    ],

    renderTpl: [
        '<tpl if="collapsible===true">',
            '<div id="{id}-collapseEl" class="', Ext.baseCSSPrefix, 'collapse-el ',
                Ext.baseCSSPrefix, 'layout-split-{collapseDir}{childElCls}">&#160;',
            '</div>',
        '</tpl>'
    ],

    baseCls: Ext.baseCSSPrefix + 'splitter',
    collapsedClsInternal: Ext.baseCSSPrefix + 'splitter-collapsed',
    
    // Default to tree, allow internal classes to disable resizing
    canResize: true,

    /**
     * @cfg {Boolean} collapsible
     * True to show a mini-collapse tool in the Splitter to toggle expand and collapse on the {@link #collapseTarget} Panel.
     * Defaults to the {@link Ext.panel.Panel#collapsible collapsible} setting of the Panel.
     */
    collapsible: false,

    /**
     * @cfg {Boolean} performCollapse
     * Set to false to prevent this Splitter's mini-collapse tool from managing the collapse
     * state of the {@link #collapseTarget}.
     */

    /**
     * @cfg {Boolean} collapseOnDblClick
     * True to enable dblclick to toggle expand and collapse on the {@link #collapseTarget} Panel.
     */
    collapseOnDblClick: true,

    /**
     * @cfg {Number} defaultSplitMin
     * Provides a default minimum width or height for the two components
     * that the splitter is between.
     */
    defaultSplitMin: 40,

    /**
     * @cfg {Number} defaultSplitMax
     * Provides a default maximum width or height for the two components
     * that the splitter is between.
     */
    defaultSplitMax: 1000,

    /**
     * @cfg {String} collapsedCls
     * A class to add to the splitter when it is collapsed. See {@link #collapsible}.
     */

    /**
     * @cfg {String/Ext.panel.Panel} collapseTarget
     * A string describing the relative position of the immediate sibling Panel to collapse. May be 'prev' or 'next'.
     *
     * Or the immediate sibling Panel to collapse.
     *
     * The orientation of the mini-collapse tool will be inferred from this setting.
     *
     * **Note that only Panels may be collapsed.**
     */
    collapseTarget: 'next',

    /**
     * @property {String} orientation
     * Orientation of this Splitter. `'vertical'` when used in an hbox layout, `'horizontal'`
     * when used in a vbox layout.
     */

    horizontal: false,
    vertical: false,

    /**
     * @cfg {Number} size
     * The size of the splitter. This becomes the height for vertical splitters and 
     * width for horizontal splitters.
     */
    size: 5,

    /**
     * Returns the config object (with an `xclass` property) for the splitter tracker. This
     * is overridden by {@link Ext.resizer.BorderSplitter BorderSplitter} to create a
     * {@link Ext.resizer.BorderSplitterTracker BorderSplitterTracker}.
     * @protected
     */
    getTrackerConfig: function () {
        return {
            xclass: 'Ext.resizer.SplitterTracker',
            el: this.el,
            splitter: this
        };
    },

    beforeRender: function() {
        var me = this,
            target = me.getCollapseTarget();

        me.callParent();

        if (target.collapsed) {
            me.addCls(me.collapsedClsInternal);
        }
        if (!me.canResize) {
            me.addCls(me.baseCls + '-noresize');
        }

        Ext.applyIf(me.renderData, {
            collapseDir: me.getCollapseDirection(),
            collapsible: me.collapsible || target.collapsible
        });

        me.protoEl.unselectable();
    },

    onRender: function() {
        var me = this,
            collapseEl;

        me.callParent(arguments);

        // Add listeners on the mini-collapse tool unless performCollapse is set to false
        if (me.performCollapse !== false) {
            if (me.renderData.collapsible) {
                me.mon(me.collapseEl, 'click', me.toggleTargetCmp, me);
            }
            if (me.collapseOnDblClick) {
                me.mon(me.el, 'dblclick', me.toggleTargetCmp, me);
            }
        }

        // Ensure the mini collapse icon is set to the correct direction when the target is collapsed/expanded by any means
        me.mon(me.getCollapseTarget(), {
            collapse: me.onTargetCollapse,
            expand: me.onTargetExpand,
            beforeexpand: me.onBeforeTargetExpand,
            beforecollapse: me.onBeforeTargetCollapse,
            scope: me
        });

        if (me.canResize) {
            me.tracker = Ext.create(me.getTrackerConfig());
            // Relay the most important events to our owner (could open wider later):
            me.relayEvents(me.tracker, [ 'beforedragstart', 'dragstart', 'dragend' ]);
        }

        collapseEl = me.collapseEl;
        if (collapseEl) {
            collapseEl.lastCollapseDirCls = me.collapseDirProps[me.collapseDirection].cls;
        }
    },

    getCollapseDirection: function() {
        var me = this,
            dir = me.collapseDirection,
            collapseTarget, idx, items, type;

        if (!dir) {
            collapseTarget = me.collapseTarget;
            if (collapseTarget.isComponent) {
                dir = collapseTarget.collapseDirection;
            }

            if (!dir) {
                // Avoid duplication of string tests.
                // Create a two bit truth table of the configuration of the Splitter:
                // Collapse Target | orientation
                //        0              0             = next, horizontal
                //        0              1             = next, vertical
                //        1              0             = prev, horizontal
                //        1              1             = prev, vertical
                type = me.ownerCt.layout.type;
                if (collapseTarget.isComponent) {
                    items = me.ownerCt.items;
                    idx = Number(items.indexOf(collapseTarget) === items.indexOf(me) - 1) << 1 | Number(type === 'hbox');
                } else {
                    idx = Number(me.collapseTarget === 'prev') << 1 | Number(type === 'hbox');
                }

                // Read the data out the truth table
                dir = ['bottom', 'right', 'top', 'left'][idx];
            }

            me.collapseDirection = dir;
        }

        me.setOrientation((dir === 'top' || dir === 'bottom') ? 'horizontal' : 'vertical');

        return dir;
    },

    getCollapseTarget: function() {
        var me = this;

        return me.collapseTarget.isComponent ? me.collapseTarget
                    : me.collapseTarget === 'prev' ? me.previousSibling() : me.nextSibling();
    },
    
    setCollapseEl: function(display){
        var el = this.collapseEl;
        if (el) {
            el.setDisplayed(display);
        }
    },
    
    onBeforeTargetExpand: function(target) {
        this.setCollapseEl('none');
    },
    
    onBeforeTargetCollapse: function(){
        this.setCollapseEl('none');
    },

    onTargetCollapse: function(target) {
        this.el.addCls([this.collapsedClsInternal, this.collapsedCls]);
        this.setCollapseEl('');
    },

    onTargetExpand: function(target) {
        this.el.removeCls([this.collapsedClsInternal, this.collapsedCls]);
        this.setCollapseEl('');
    },

    collapseDirProps: {
        top: {
            cls: Ext.baseCSSPrefix + 'layout-split-top'
        },
        right: {
            cls: Ext.baseCSSPrefix + 'layout-split-right'
        },
        bottom: {
            cls: Ext.baseCSSPrefix + 'layout-split-bottom'
        },
        left: {
            cls: Ext.baseCSSPrefix + 'layout-split-left'
        }
    },

    orientationProps: {
        horizontal: {
            opposite: 'vertical',
            fixedAxis: 'height',
            stretchedAxis: 'width'
        },
        vertical: {
            opposite: 'horizontal',
            fixedAxis: 'width',
            stretchedAxis: 'height'
        }
    },

    applyCollapseDirection: function () {
        var me = this,
            collapseEl = me.collapseEl,
            collapseDirProps = me.collapseDirProps[me.collapseDirection],
            cls;

        if (collapseEl) {
            cls = collapseEl.lastCollapseDirCls;
            if (cls) {
                collapseEl.removeCls(cls);
            }

            collapseEl.addCls(collapseEl.lastCollapseDirCls = collapseDirProps.cls);
        }
    },

    applyOrientation: function () {
        var me = this,
            orientation = me.orientation,
            orientationProps = me.orientationProps[orientation],
            defaultSize = me.size,
            fixedSizeProp = orientationProps.fixedAxis,
            stretchSizeProp = orientationProps.stretchedAxis,
            cls = me.baseCls + '-';

        me[orientation] = true;
        me[orientationProps.opposite] = false;

        if (!me.hasOwnProperty(fixedSizeProp) || me[fixedSizeProp] === '100%') {
            me[fixedSizeProp] = defaultSize;
        }
        if (!me.hasOwnProperty(stretchSizeProp) || me[stretchSizeProp] === defaultSize) {
            me[stretchSizeProp] = '100%';
        }

        me.removeCls(cls + orientationProps.opposite);
        me.addCls(cls + orientation);
    },

    setOrientation: function (orientation) {
        var me = this;

        if (me.orientation !== orientation) {
            me.orientation = orientation;
            me.applyOrientation();
        }
    },
    
    updateOrientation: function () {
        delete this.collapseDirection; // recompute
        this.getCollapseDirection();
        this.applyCollapseDirection();
    },

    toggleTargetCmp: function(e, t) {
        var cmp = this.getCollapseTarget(),
            placeholder = cmp.placeholder,
            toggle;

        // We can only toggle the target if it offers the expand/collapse API
        if (Ext.isFunction(cmp.expand) && Ext.isFunction(cmp.collapse)) {
            if (placeholder && !placeholder.hidden) {
                toggle = true;
            } else {
                toggle = !cmp.hidden;
            }

            if (toggle) {
                if (cmp.collapsed) {
                    cmp.expand();
                } else if (cmp.collapseDirection) {
                    cmp.collapse();
                } else {
                    cmp.collapse(this.renderData.collapseDir);
                }
            }
        }
    },

    /*
     * Work around IE bug. %age margins do not get recalculated on element resize unless repaint called.
     */
    setSize: function() {
        var me = this;
        me.callParent(arguments);
        if (Ext.isIE && me.el) {
            me.el.repaint();
        }
    },
    
    beforeDestroy: function(){
        Ext.destroy(this.tracker);
        this.callParent();
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Private utility class for Ext.layout.container.Border.
 * @private
 */
Ext.define('Ext.resizer.BorderSplitter', {
    extend:  Ext.resizer.Splitter ,

                                                

    alias: 'widget.bordersplitter',

    // must be configured in by the border layout:
    collapseTarget: null,

    getTrackerConfig: function () {
        var trackerConfig = this.callParent();

        trackerConfig.xclass = 'Ext.resizer.BorderSplitterTracker';

        return trackerConfig;
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * This is a multi-pane, application-oriented UI layout style that supports multiple nested panels, automatic bars
 * between regions and built-in {@link Ext.panel.Panel#collapsible expanding and collapsing} of regions.
 *
 * This class is intended to be extended or created via the `layout:'border'` {@link Ext.container.Container#layout}
 * config, and should generally not need to be created directly via the new keyword.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         width: 500,
 *         height: 300,
 *         title: 'Border Layout',
 *         layout: 'border',
 *         items: [{
 *             title: 'South Region is resizable',
 *             region: 'south',     // position for region
 *             xtype: 'panel',
 *             height: 100,
 *             split: true,         // enable resizing
 *             margins: '0 5 5 5'
 *         },{
 *             // xtype: 'panel' implied by default
 *             title: 'West Region is collapsible',
 *             region:'west',
 *             xtype: 'panel',
 *             margins: '5 0 0 5',
 *             width: 200,
 *             collapsible: true,   // make collapsible
 *             id: 'west-region-container',
 *             layout: 'fit'
 *         },{
 *             title: 'Center Region',
 *             region: 'center',     // center region is required, no width/height specified
 *             xtype: 'panel',
 *             layout: 'fit',
 *             margins: '5 5 0 0'
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 *
 * # Notes
 * 
 *   - When using the split option, the layout will automatically insert a {@link Ext.resizer.Splitter}
 *     into the appropriate place. This will modify the underlying
 *     {@link Ext.container.Container#property-items items} collection in the container.
 *
 *   - Any Container using the Border layout **must** have a child item with `region:'center'`.
 *     The child item in the center region will always be resized to fill the remaining space
 *     not used by the other regions in the layout.
 *
 *   - Any child items with a region of `west` or `east` may be configured with either an initial
 *     `width`, or a {@link Ext.layout.container.Box#flex} value, or an initial percentage width
 *     **string** (Which is simply divided by 100 and used as a flex value).
 *     The 'center' region has a flex value of `1`.
 *
 *   - Any child items with a region of `north` or `south` may be configured with either an initial
 *     `height`, or a {@link Ext.layout.container.Box#flex} value, or an initial percentage height
 *     **string** (Which is simply divided by 100 and used as a flex value).
 *     The 'center' region has a flex value of `1`.
 *
 *   - **There is no BorderLayout.Region class in ExtJS 4.0+**
 */
Ext.define('Ext.layout.container.Border', {

    extend:  Ext.layout.container.Container ,
    alias: 'layout.border',
    alternateClassName: 'Ext.layout.BorderLayout',

               
                                     
                      

                                                                  
                                            
      


    targetCls: Ext.baseCSSPrefix + 'border-layout-ct',

    itemCls: [Ext.baseCSSPrefix + 'border-item', Ext.baseCSSPrefix + 'box-item'],

    type: 'border',

    isBorderLayout: true,

    /**
     * @cfg {Boolean} split
     * This configuration option is to be applied to the **child `items`** managed by this layout.
     * Each region with `split:true` will get a {@link Ext.resizer.BorderSplitter Splitter} that
     * allows for manual resizing of the container. Except for the `center` region.
     */
    
    /**
     * @cfg {Boolean} [splitterResize=true]
     * This configuration option is to be applied to the **child `items`** managed by this layout and
     * is used in conjunction with {@link #split}. By default, when specifying {@link #split}, the region
     * can be dragged to be resized. Set this option to false to show the split bar but prevent resizing.
     */

    /**
     * @cfg {Number/String/Object} padding
     * Sets the padding to be applied to all child items managed by this layout.
     * 
     * This property can be specified as a string containing space-separated, numeric
     * padding values. The order of the sides associated with each value matches the way
     * CSS processes padding values:
     *
     *  - If there is only one value, it applies to all sides.
     *  - If there are two values, the top and bottom borders are set to the first value
     *    and the right and left are set to the second.
     *  - If there are three values, the top is set to the first value, the left and right
     *    are set to the second, and the bottom is set to the third.
     *  - If there are four values, they apply to the top, right, bottom, and left,
     *    respectively.
     *
     */
    padding: undefined,

    percentageRe: /(\d+)%/,
    
    horzMarginProp: 'left',
    padOnContainerProp: 'left',
    padNotOnContainerProp: 'right',

    /**
     * Reused meta-data objects that describe axis properties.
     * @private
     */
    axisProps: {
        horz: {
            borderBegin: 'west',
            borderEnd: 'east',
            horizontal: true,
            posProp: 'x',
            sizeProp: 'width',
            sizePropCap: 'Width'
        },
        vert: {
            borderBegin: 'north',
            borderEnd: 'south',
            horizontal: false,
            posProp: 'y',
            sizeProp: 'height',
            sizePropCap: 'Height'
        }
    },

    // @private
    centerRegion: null,

    manageMargins: true,

    panelCollapseAnimate: true,

    panelCollapseMode: 'placeholder',

    /**
     * @cfg {Object} regionWeights
     * The default weights to assign to regions in the border layout. These values are
     * used when a region does not contain a `weight` property. This object must have
     * properties for all regions ("north", "south", "east" and "west").
     * 
     * **IMPORTANT:** Since this is an object, changing its properties will impact ALL
     * instances of Border layout. If this is not desired, provide a replacement object as
     * a config option instead:
     * 
     *      layout: {
     *          type: 'border',
     *          regionWeights: {
     *              west: 20,
     *              north: 10,
     *              south: -10,
     *              east: -20
     *          }
     *      }
     *
     * The region with the highest weight is assigned space from the border before other
     * regions. Regions of equal weight are assigned space based on their position in the
     * owner's items list (first come, first served).
     */
    regionWeights: {
        north: 20,
        south: 10,
        center: 0,
        west: -10,
        east: -20
    },

    //----------------------------------
    // Layout processing

    /**
     * Creates the axis objects for the layout. These are only missing size information
     * which is added during {@link #calculate}.
     * @private
     */
    beginAxis: function (ownerContext, regions, name) {
        var me = this,
            props = me.axisProps[name],
            isVert = !props.horizontal,
            sizeProp = props.sizeProp,
            totalFlex = 0,
            childItems = ownerContext.childItems,
            length = childItems.length,
            center, i, childContext, centerFlex, comp, region, match, size, type, target, placeholder;

        for (i = 0; i < length; ++i) {
            childContext = childItems[i];
            comp = childContext.target;

            childContext.layoutPos = {};

            if (comp.region) {
                childContext.region = region = comp.region;

                childContext.isCenter = comp.isCenter;
                childContext.isHorz = comp.isHorz;
                childContext.isVert = comp.isVert;

                childContext.weight = comp.weight || me.regionWeights[region] || 0;
                regions[comp.id] = childContext;

                if (comp.isCenter) {
                    center = childContext;
                    centerFlex = comp.flex;
                    ownerContext.centerRegion = center;

                    continue;
                }

                if (isVert !== childContext.isVert) {
                    continue;
                }

                // process regions "isVert ? north||south : east||center||west"

                childContext.reverseWeighting = (region == props.borderEnd);

                size = comp[sizeProp];
                type = typeof size;

                if (!comp.collapsed) {
                    if (type == 'string' && (match = me.percentageRe.exec(size))) {
                        childContext.percentage = parseInt(match[1], 10);
                    } else if (comp.flex) {
                        totalFlex += childContext.flex = comp.flex;
                    }
                }
            }
        }

        // Special cases for a collapsed center region
        if (center) {
            target = center.target;

            if ((placeholder = target.placeholderFor)) {
                if (!centerFlex && isVert === placeholder.collapsedVertical()) {
                    // The center region is a placeholder, collapsed in this axis
                    centerFlex = 0;
                    center.collapseAxis = name;
                }
            } else if (target.collapsed && (isVert === target.collapsedVertical())) {
                // The center region is a collapsed header, collapsed in this axis
                centerFlex = 0;
                center.collapseAxis = name;
            }
        }

        if (centerFlex == null) {
            // If we still don't have a center flex, default to 1
            centerFlex = 1;
        }

        totalFlex += centerFlex;

        return Ext.apply({
            before         : isVert ? 'top' : 'left',
            totalFlex      : totalFlex
        }, props);
    },

    beginLayout: function (ownerContext) {
        var me = this,
            items = me.getLayoutItems(),
            pad = me.padding,
            type = typeof pad,
            padOnContainer = false,
            childContext, item, length, i, regions, collapseTarget,
            doShow, hidden, region;

        // We sync the visibility state of splitters with their region:
        if (pad) {
            if (type == 'string' || type == 'number') {
                pad = Ext.util.Format.parseBox(pad);
            }
        } else {
            pad = ownerContext.getEl('getTargetEl').getPaddingInfo();
            padOnContainer = true;
        }
        ownerContext.outerPad = pad;
        ownerContext.padOnContainer = padOnContainer;

        for (i = 0, length = items.length; i < length; ++i) {
            item = items[i];
            collapseTarget = me.getSplitterTarget(item);
            if (collapseTarget) {  // if (splitter)
                doShow = undefined;
                hidden = !!item.hidden;
                if (!collapseTarget.split) {
                    if (collapseTarget.isCollapsingOrExpanding) {
                        doShow = !!collapseTarget.collapsed;
                    }
                } else if (hidden !== collapseTarget.hidden) {
                    doShow = !collapseTarget.hidden;
                }

                if (doShow) {
                    item.show();
                } else if (doShow === false) {
                    item.hide();
                }
            }
        }

        // The above synchronized visibility of splitters with their regions, so we need
        // to make this call after that so that childItems and visibleItems are correct:
        //
        me.callParent(arguments);

        items = ownerContext.childItems;
        length = items.length;
        regions = {};

        ownerContext.borderAxisHorz = me.beginAxis(ownerContext, regions, 'horz');
        ownerContext.borderAxisVert = me.beginAxis(ownerContext, regions, 'vert');

        // Now that weights are assigned to the region's contextItems, we assign those
        // same weights to the contextItem for the splitters. We also cross link the
        // contextItems for the collapseTarget and its splitter.
        for (i = 0; i < length; ++i) {
            childContext = items[i];
            collapseTarget = me.getSplitterTarget(childContext.target);

            if (collapseTarget) { // if (splitter)
                region = regions[collapseTarget.id]
                if (!region) {
                        // if the region was hidden it will not be part of childItems, and
                        // so beginAxis() won't add it to the regions object, so we have
                        // to create the context item here.
                        region = ownerContext.getEl(collapseTarget.el, me);
                        region.region = collapseTarget.region;
                }
                childContext.collapseTarget = collapseTarget = region;
                childContext.weight = collapseTarget.weight;
                childContext.reverseWeighting = collapseTarget.reverseWeighting;
                collapseTarget.splitter = childContext;
                childContext.isHorz = collapseTarget.isHorz;
                childContext.isVert = collapseTarget.isVert;
            }
        }

        // Now we want to sort the childItems by their weight.
        me.sortWeightedItems(items, 'reverseWeighting');
        me.setupSplitterNeighbors(items);
    },

    calculate: function (ownerContext) {
        var me = this,
            containerSize = me.getContainerSize(ownerContext),
            childItems = ownerContext.childItems,
            length = childItems.length,
            horz = ownerContext.borderAxisHorz,
            vert = ownerContext.borderAxisVert,
            pad = ownerContext.outerPad,
            padOnContainer = ownerContext.padOnContainer,
            i, childContext, childMargins, size, horzPercentTotal, vertPercentTotal;

        horz.begin = pad[me.padOnContainerProp];
        vert.begin = pad.top;
        // If the padding is already on the container we need to add it to the space
        // If not on the container, it's "virtual" padding.
        
        horzPercentTotal = horz.end = horz.flexSpace = containerSize.width + (padOnContainer ? pad[me.padOnContainerProp] : -pad[me.padNotOnContainerProp]);
        vertPercentTotal = vert.end = vert.flexSpace = containerSize.height + (padOnContainer ? pad.top : -pad.bottom);

        // Reduce flexSpace on each axis by the fixed/auto sized dimensions of items that
        // aren't flexed along that axis.
        for (i = 0; i < length; ++i) {
            childContext = childItems[i];
            childMargins = childContext.getMarginInfo();

            // Margins are always fixed size and must be removed from the space used for percentages and flexes
            if (childContext.isHorz || childContext.isCenter) {
                horz.addUnflexed(childMargins.width);
                horzPercentTotal -= childMargins.width;
            }

            if (childContext.isVert || childContext.isCenter) {
                vert.addUnflexed(childMargins.height);
                vertPercentTotal -= childMargins.height;
            }

            // Fixed size components must have their sizes removed from the space used for flex
            if (!childContext.flex && !childContext.percentage) {
                if (childContext.isHorz || (childContext.isCenter && childContext.collapseAxis === 'horz')) {
                    size = childContext.getProp('width');

                    horz.addUnflexed(size);

                    // splitters should not count towards percentages
                    if (childContext.collapseTarget) {
                        horzPercentTotal -= size;
                    }
                } else if (childContext.isVert || (childContext.isCenter && childContext.collapseAxis === 'vert')) {
                    size = childContext.getProp('height');

                    vert.addUnflexed(size);

                    // splitters should not count towards percentages
                    if (childContext.collapseTarget) {
                        vertPercentTotal -= size;
                    }
                }
                // else ignore center since it is fully flexed
            }
        }

        for (i = 0; i < length; ++i) {
            childContext = childItems[i];
            childMargins = childContext.getMarginInfo();

            // Calculate the percentage sizes. After this calculation percentages are very similar to fixed sizes
            if (childContext.percentage) {
                if (childContext.isHorz) {
                    size = Math.ceil(horzPercentTotal * childContext.percentage / 100);
                    size = childContext.setWidth(size);
                    horz.addUnflexed(size);
                } else if (childContext.isVert) {
                    size = Math.ceil(vertPercentTotal * childContext.percentage / 100);
                    size = childContext.setHeight(size);
                    vert.addUnflexed(size);
                }
                // center shouldn't have a percentage but if it does it should be ignored
            }
        }


        // If we haven't gotten sizes for all unflexed dimensions on an axis, the flexSpace
        // will be NaN so we won't be calculating flexed dimensions until that is resolved.

        for (i = 0; i < length; ++i) {
            childContext = childItems[i];

            if (!childContext.isCenter) {
                me.calculateChildAxis(childContext, horz);
                me.calculateChildAxis(childContext, vert);
            }
        }

        // Once all items are placed, the final size of the center can be determined. If we
        // can determine both width and height, we are done. We use '+' instead of '&&' to
        // avoid short-circuiting (we want to call both):
        if (me.finishAxis(ownerContext, vert) + me.finishAxis(ownerContext, horz) < 2) {
            me.done = false;
        } else {
            // Size information is published as we place regions but position is hard to do
            // that way (while avoiding published multiple times) so we publish all the
            // positions at the end.
            me.finishPositions(childItems);
        }
    },

    /**
     * Performs the calculations for a region on a specified axis.
     * @private
     */
    calculateChildAxis: function (childContext, axis) {
        var collapseTarget = childContext.collapseTarget,
            setSizeMethod = 'set' + axis.sizePropCap,
            sizeProp = axis.sizeProp,
            childMarginSize = childContext.getMarginInfo()[sizeProp],
            region, isBegin, flex, pos, size;

        if (collapseTarget) { // if (splitter)
            region = collapseTarget.region;
        } else {
            region = childContext.region;
            flex = childContext.flex;
        }

        isBegin = region == axis.borderBegin;

        if (!isBegin && region != axis.borderEnd) {
            // a north/south region on the horizontal axis or an east/west region on the
            // vertical axis: stretch to fill remaining space:
            childContext[setSizeMethod](axis.end - axis.begin - childMarginSize);
            pos = axis.begin;
        } else {
            if (flex) {
                size = Math.ceil(axis.flexSpace * (flex / axis.totalFlex));
                size = childContext[setSizeMethod](size);
            } else if (childContext.percentage) {
                // Like getProp but without registering a dependency - we calculated the size, we don't depend on it
                size = childContext.peek(sizeProp);
            } else {
                size = childContext.getProp(sizeProp);
            }

            size += childMarginSize;

            if (isBegin) {
                pos = axis.begin;
                axis.begin += size;
            } else {
                axis.end = pos = axis.end - size;
            }
        }

        childContext.layoutPos[axis.posProp] = pos;
    },

    /**
     * Finishes the calculations on an axis. This basically just assigns the remaining
     * space to the center region.
     * @private
     */
    finishAxis: function (ownerContext, axis) {
        var size = axis.end - axis.begin,
            center = ownerContext.centerRegion;

        if (center) {
            center['set' + axis.sizePropCap](size - center.getMarginInfo()[axis.sizeProp]);
            center.layoutPos[axis.posProp] = axis.begin;
        }

        return Ext.isNumber(size) ? 1 : 0;
    },

    /**
     * Finishes by setting the positions on the child items.
     * @private
     */
    finishPositions: function (childItems) {
        var length = childItems.length,
            index, childContext,
            marginProp = this.horzMarginProp;

        for (index = 0; index < length; ++index) {
            childContext = childItems[index];

            childContext.setProp('x', childContext.layoutPos.x + childContext.marginInfo[marginProp]);
            childContext.setProp('y', childContext.layoutPos.y + childContext.marginInfo.top);
        }
    },

    getLayoutItems: function() {
        var owner = this.owner,
            ownerItems = (owner && owner.items && owner.items.items) || [],
            length = ownerItems.length,
            items = [],
            i = 0,
            ownerItem, placeholderFor;

        for (; i < length; i++) {
            ownerItem = ownerItems[i];
            placeholderFor = ownerItem.placeholderFor;
            // There are a couple of scenarios where we do NOT want an item to
            // be included in the layout items:
            //
            // 1. If the item is floated. This can happen when a region's header
            // is clicked to "float" the item, then another region's header or
            // is clicked quickly before the first floated region has had a
            // chance to slide out. When this happens, the second click triggers
            // a layout, the purpose of which is to determine what the size of the 
            // second region will be after it is floated, so it can be animated
            // to that size. In this case the existing floated item should not be
            // included in the layout items because it will not be visible once
            // it's slideout animation has completed.
            //
            // 2. If the item is a placeholder for a panel that is currently
            // being expanded. Similar to scenario 1, a second layout can be
            // triggered by another panel being expanded/collapsed/floated before
            // the first panel has finished it's expand animation. If this is the
            // case we do not want the placeholder to be included in the layout
            // items because it will not be once the panel has finished expanding.
            //
            // If the component is hidden, we need none of these shenanigans
            if (ownerItem.hidden || ((!ownerItem.floated || ownerItem.isCollapsingOrExpanding === 2) &&
                !(placeholderFor && placeholderFor.isCollapsingOrExpanding === 2))) {
                items.push(ownerItem);
            } 
        }

        return items;
    },

    getPlaceholder: function (comp) {
        return comp.getPlaceholder && comp.getPlaceholder();
    },

    getSplitterTarget: function (splitter) {
        var collapseTarget = splitter.collapseTarget;

        if (collapseTarget && collapseTarget.collapsed) {
            return collapseTarget.placeholder || collapseTarget;
        }

        return collapseTarget;
    },

    isItemBoxParent: function (itemContext) {
        return true;
    },

    isItemShrinkWrap: function (item) {
        return true;
    },

    //----------------------------------
    // Event handlers

    /**
     * Inserts the splitter for a given region. A reference to the splitter is also stored
     * on the component as "splitter".
     * @private
     */
    insertSplitter: function (item, index, hidden, splitterCfg) {
        var region = item.region,
            splitter = Ext.apply({
                xtype: 'bordersplitter',
                collapseTarget: item,
                id: item.id + '-splitter',
                hidden: hidden,
                canResize: item.splitterResize !== false,
                splitterFor: item
            }, splitterCfg),
            at = index + ((region === 'south' || region === 'east') ? 0 : 1);

        if (item.collapseMode === 'mini') {
            splitter.collapsedCls = item.collapsedCls;
        }

        item.splitter = this.owner.add(at, splitter);
    },

    /**
     * Called when a region (actually when any component) is added to the container. The
     * region is decorated with some helpful properties (isCenter, isHorz, isVert) and its
     * splitter is added if its "split" property is true.
     * @private
     */
    onAdd: function (item, index) {
        var me = this,
            placeholderFor = item.placeholderFor,
            region = item.region,
            split,
            hidden,
            cfg;

        me.callParent(arguments);

        if (region) {
            Ext.apply(item, me.regionFlags[region]);

            if (item.initBorderRegion) {
                // This method should always be present but perhaps the override is being
                // excluded.
                item.initBorderRegion();
            }

            if (region === 'center') {
                me.centerRegion = item;
            } else {
                split = item.split;
                hidden = !!item.hidden;
                
                if (typeof split === 'object') {
                    cfg = split;
                    split = true;
                }
                
                if ((item.isHorz || item.isVert) && (split || item.collapseMode == 'mini')) {
                    me.insertSplitter(item, index, hidden || !split, cfg);
                }
            }

            if (!item.hasOwnProperty('collapseMode')) {
                item.collapseMode = me.panelCollapseMode;
            }

            if (!item.hasOwnProperty('animCollapse')) {
                if (item.collapseMode !== 'placeholder') {
                    // other collapse modes do not animate nicely in a border layout, so
                    // default them to off:
                    item.animCollapse = false;
                } else {
                    item.animCollapse = me.panelCollapseAnimate;
                }
            }
        } else if (placeholderFor) {
            Ext.apply(item, me.regionFlags[placeholderFor.region]);
            item.region = placeholderFor.region;
            item.weight = placeholderFor.weight;
        }
    },

    onDestroy: function() {
        this.centerRegion = null;
        this.callParent();
    },

    onRemove: function (item) {
        var me = this,
            region = item.region,
            splitter = item.splitter;

        if (region) {
            if (item.isCenter) {
                me.centerRegion = null;
            }

            delete item.isCenter;
            delete item.isHorz;
            delete item.isVert;

            if (splitter) {
                me.owner.doRemove(splitter, true); // avoid another layout
                delete item.splitter;
            }
        }

        me.callParent(arguments);
    },

    //----------------------------------
    // Misc

    regionMeta: {
        center: { splitterDelta: 0 },

        north: { splitterDelta:  1 },
        south: { splitterDelta: -1 },

        west:  { splitterDelta:  1 },
        east:  { splitterDelta: -1 }
    },

    /**
     * Flags and configs that get set of regions based on their `region` property.
     * @private
     */
    regionFlags: {
        center: { isCenter: true, isHorz: false, isVert: false },

        north: { isCenter: false, isHorz: false, isVert: true, collapseDirection: 'top' },
        south: { isCenter: false, isHorz: false, isVert: true, collapseDirection: 'bottom' },

        west: { isCenter: false, isHorz: true, isVert: false, collapseDirection: 'left' },
        east: { isCenter: false, isHorz: true, isVert: false, collapseDirection: 'right' }
    },

    setupSplitterNeighbors: function (items) {
        var edgeRegions = {
                //north: null,
                //south: null,
                //east: null,
                //west: null
            },
            length = items.length,
            touchedRegions = this.touchedRegions,
            i, j, center, count, edge, comp, region, splitter, touched;

        for (i = 0; i < length; ++i) {
            comp = items[i].target;
            region = comp.region;

            if (comp.isCenter) {
                center = comp;
            } else if (region) {
                touched = touchedRegions[region];

                for (j = 0, count = touched.length; j < count; ++j) {
                    edge = edgeRegions[touched[j]];
                    if (edge) {
                        edge.neighbors.push(comp);
                    }
                }
                
                if (comp.placeholderFor) {
                    // placeholder, so grab the splitter for the actual panel
                    splitter = comp.placeholderFor.splitter;
                } else {
                    splitter = comp.splitter;
                }
                if (splitter) {
                    splitter.neighbors = [];
                }

                edgeRegions[region] = splitter;
            }
        }

        if (center) {
            touched = touchedRegions.center;

            for (j = 0, count = touched.length; j < count; ++j) {
                edge = edgeRegions[touched[j]];
                if (edge) {
                    edge.neighbors.push(center);
                }
            }
        }
    },

    /**
     * Lists the regions that would consider an interior region a neighbor. For example,
     * a north region would consider an east or west region its neighbords (as well as
     * an inner north region).
     * @private
     */
    touchedRegions: {
        center: [ 'north', 'south', 'east',  'west' ],

        north:  [ 'north', 'east',  'west'  ],
        south:  [ 'south', 'east',  'west'  ],
        east:   [ 'east',  'north', 'south' ],
        west:   [ 'west',  'north', 'south' ]
    },

    sizePolicies: {
        vert: {
            readsWidth: 0,
            readsHeight: 1,
            setsWidth: 1,
            setsHeight: 0
        },
        horz: {
            readsWidth: 1,
            readsHeight: 0,
            setsWidth: 0,
            setsHeight: 1
        },
        flexAll: {
            readsWidth: 0,
            readsHeight: 0,
            setsWidth: 1,
            setsHeight: 1
        }
    },

    getItemSizePolicy: function (item) {
        var me = this,
            policies = this.sizePolicies,
            collapseTarget, size, policy, placeholderFor;

        if (item.isCenter) {
            placeholderFor = item.placeholderFor;

            if (placeholderFor) {
                if (placeholderFor.collapsedVertical()) {
                    return policies.vert;
                }
                return policies.horz;
            }
            if (item.collapsed) {
                if (item.collapsedVertical()) {
                    return policies.vert;
                }
                return policies.horz;
            }
            return policies.flexAll;
        }

        collapseTarget = item.collapseTarget;

        if (collapseTarget) {
            return collapseTarget.isVert ? policies.vert : policies.horz;
        }

        if (item.region) {
            if (item.isVert) {
                size = item.height;
                policy = policies.vert;
            } else {
                size = item.width;
                policy = policies.horz;
            }

            if (item.flex || (typeof size == 'string' && me.percentageRe.test(size))) {
                return policies.flexAll;
            }

            return policy;
        }

        return me.autoSizePolicy;
    }
}, function () {
    var methods = {
        addUnflexed: function (px) {
            this.flexSpace = Math.max(this.flexSpace - px, 0);
        }
    },
    props = this.prototype.axisProps;

    Ext.apply(props.horz, methods);
    Ext.apply(props.vert, methods);
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Private utility class for Ext.Splitter.
 * @private
 */
Ext.define('Ext.resizer.SplitterTracker', {
    extend:  Ext.dd.DragTracker ,
                                  
    enabled: true,
    
    overlayCls: Ext.baseCSSPrefix + 'resizable-overlay',

    createDragOverlay: function () {
        var overlay;

        overlay = this.overlay =  Ext.getBody().createChild({
            cls: this.overlayCls, 
            html: '&#160;'
        });

        overlay.unselectable();
        overlay.setSize(Ext.Element.getViewWidth(true), Ext.Element.getViewHeight(true));
        overlay.show();
    },

    getPrevCmp: function() {
        var splitter = this.getSplitter();
        return splitter.previousSibling(':not([hidden])');
    },

    getNextCmp: function() {
        var splitter = this.getSplitter();
        return splitter.nextSibling(':not([hidden])');
    },

    // ensure the tracker is enabled, store boxes of previous and next
    // components and calculate the constrain region
    onBeforeStart: function(e) {
        var me = this,
            prevCmp = me.getPrevCmp(),
            nextCmp = me.getNextCmp(),
            collapseEl = me.getSplitter().collapseEl,
            target = e.getTarget(),
            box;
            
        if (!prevCmp || !nextCmp) {
            return false;
        }

        if (collapseEl && target === me.getSplitter().collapseEl.dom) {
            return false;
        }

        // SplitterTracker is disabled if any of its adjacents are collapsed.
        if (nextCmp.collapsed || prevCmp.collapsed) {
            return false;
        }

        // store boxes of previous and next
        me.prevBox  = prevCmp.getEl().getBox();
        me.nextBox  = nextCmp.getEl().getBox();
        me.constrainTo = box = me.calculateConstrainRegion();

        if (!box) {
            return false;
        }

        return box;
    },

    // We move the splitter el. Add the proxy class.
    onStart: function(e) {
        var splitter = this.getSplitter();
        this.createDragOverlay();
        splitter.addCls(splitter.baseCls + '-active');
    },

    // calculate the constrain Region in which the splitter el may be moved.
    calculateConstrainRegion: function() {
        var me         = this,
            splitter   = me.getSplitter(),
            splitWidth = splitter.getWidth(),
            defaultMin = splitter.defaultSplitMin,
            orient     = splitter.orientation,
            prevBox    = me.prevBox,
            prevCmp    = me.getPrevCmp(),
            nextBox    = me.nextBox,
            nextCmp    = me.getNextCmp(),
            // prev and nextConstrainRegions are the maximumBoxes minus the
            // minimumBoxes. The result is always the intersection
            // of these two boxes.
            prevConstrainRegion, nextConstrainRegion, constrainOptions;

        // vertical splitters, so resizing left to right
        if (orient === 'vertical') {
            constrainOptions = {
                prevCmp: prevCmp,
                nextCmp: nextCmp,
                prevBox: prevBox,
                nextBox: nextBox,
                defaultMin: defaultMin,
                splitWidth: splitWidth
            };
            // Region constructor accepts (top, right, bottom, left)
            // anchored/calculated from the left
            prevConstrainRegion = new Ext.util.Region(
                prevBox.y,
                me.getVertPrevConstrainRight(constrainOptions),
                prevBox.bottom,
                me.getVertPrevConstrainLeft(constrainOptions)
            );
            // anchored/calculated from the right
            nextConstrainRegion = new Ext.util.Region(
                nextBox.y,
                me.getVertNextConstrainRight(constrainOptions),
                nextBox.bottom,
                me.getVertNextConstrainLeft(constrainOptions)
            );
        } else {
            // anchored/calculated from the top
            prevConstrainRegion = new Ext.util.Region(
                prevBox.y + (prevCmp.minHeight || defaultMin),
                prevBox.right,
                // Bottom boundary is y + maxHeight if there IS a maxHeight.
                // Otherwise it is calculated based upon the minWidth of the next Component
                (prevCmp.maxHeight ? prevBox.y + prevCmp.maxHeight : nextBox.bottom - (nextCmp.minHeight || defaultMin)) + splitWidth,
                prevBox.x
            );
            // anchored/calculated from the bottom
            nextConstrainRegion = new Ext.util.Region(
                // Top boundary is bottom - maxHeight if there IS a maxHeight.
                // Otherwise it is calculated based upon the minHeight of the previous Component
                (nextCmp.maxHeight ? nextBox.bottom - nextCmp.maxHeight : prevBox.y + (prevCmp.minHeight || defaultMin)) - splitWidth,
                nextBox.right,
                nextBox.bottom - (nextCmp.minHeight || defaultMin),
                nextBox.x
            );
        }

        // intersection of the two regions to provide region draggable
        return prevConstrainRegion.intersect(nextConstrainRegion);
    },

    // Performs the actual resizing of the previous and next components
    performResize: function(e, offset) {
        var me        = this,
            splitter  = me.getSplitter(),
            orient    = splitter.orientation,
            prevCmp   = me.getPrevCmp(),
            nextCmp   = me.getNextCmp(),
            owner     = splitter.ownerCt,
            flexedSiblings = owner.query('>[flex]'),
            len       = flexedSiblings.length,
            vertical  = orient === 'vertical',
            i         = 0,
            dimension = vertical ? 'width' : 'height',
            totalFlex = 0,
            item, size;

        // Convert flexes to pixel values proportional to the total pixel width of all flexes.
        for (; i < len; i++) {
            item = flexedSiblings[i];
            size = vertical ? item.getWidth() : item.getHeight();
            totalFlex += size;
            item.flex = size;
        }

        offset = vertical ? offset[0] : offset[1];

        if (prevCmp) {
            size = me.prevBox[dimension] + offset;
            if (prevCmp.flex) {
                prevCmp.flex = size;
            } else {
                prevCmp[dimension] = size;
            }
        }
        if (nextCmp) {
            size = me.nextBox[dimension] - offset;
            if (nextCmp.flex) {
                nextCmp.flex = size;
            } else {
                nextCmp[dimension] = size;
            }
        }

        owner.updateLayout();
    },

    // Cleans up the overlay (if we have one) and calls the base. This cannot be done in
    // onEnd, because onEnd is only called if a drag is detected but the overlay is created
    // regardless (by onBeforeStart).
    endDrag: function () {
        var me = this;

        if (me.overlay) {
             me.overlay.remove();
             delete me.overlay;
        }

        me.callParent(arguments); // this calls onEnd
    },

    // perform the resize and remove the proxy class from the splitter el
    onEnd: function(e) {
        var me = this,
            splitter = me.getSplitter();
            
        splitter.removeCls(splitter.baseCls + '-active');
        me.performResize(e, me.getResizeOffset());
    },

    // Track the proxy and set the proper XY coordinates
    // while constraining the drag
    onDrag: function(e) {
        var me        = this,
            offset    = me.getOffset('dragTarget'),
            splitter  = me.getSplitter(),
            splitEl   = splitter.getEl(),
            orient    = splitter.orientation;

        if (orient === "vertical") {
            splitEl.setX(me.startRegion.left + offset[0]);
        } else {
            splitEl.setY(me.startRegion.top + offset[1]);
        }
    },

    getSplitter: function() {
        return this.splitter;
    },

    getVertPrevConstrainRight: function(o) {
        // Right boundary is x + maxWidth if there IS a maxWidth.
        // Otherwise it is calculated based upon the minWidth of the next Component
        return (o.prevCmp.maxWidth ? o.prevBox.x + o.prevCmp.maxWidth :
            o.nextBox.right - (o.nextCmp.minWidth || o.defaultMin)) + o.splitWidth;
    },

    getVertPrevConstrainLeft: function(o) {
        return o.prevBox.x + (o.prevCmp.minWidth || o.defaultMin);
    },


    getVertNextConstrainRight: function(o) {
        return o.nextBox.right - (o.nextCmp.minWidth || o.defaultMin);
    },

    getVertNextConstrainLeft: function(o) {
        // Left boundary is right - maxWidth if there IS a maxWidth.
        // Otherwise it is calculated based upon the minWidth of the previous Component
        return (o.nextCmp.maxWidth ? o.nextBox.right - o.nextCmp.maxWidth :
            o.prevBox.x + (o.prevBox.minWidth || o.defaultMin)) - o.splitWidth;
    },

    getResizeOffset: function() {
        return this.getOffset('dragTarget');
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * Private utility class for Ext.BorderSplitter.
 * @private
 */
Ext.define('Ext.resizer.BorderSplitterTracker', {
    extend:  Ext.resizer.SplitterTracker ,
                                  

    getPrevCmp: null,
    getNextCmp: null,

    // calculate the constrain Region in which the splitter el may be moved.
    calculateConstrainRegion: function() {
        var me = this,
            splitter = me.splitter,
            collapseTarget = splitter.collapseTarget,
            defaultSplitMin = splitter.defaultSplitMin,
            sizePropCap = splitter.vertical ? 'Width' : 'Height',
            minSizeProp = 'min' + sizePropCap,
            maxSizeProp = 'max' + sizePropCap,
            getSizeMethod = 'get' + sizePropCap,
            neighbors = splitter.neighbors,
            length = neighbors.length,
            box = collapseTarget.el.getBox(),
            left = box.x,
            top = box.y,
            right = box.right,
            bottom = box.bottom,
            size = splitter.vertical ? (right - left) : (bottom - top),
            //neighborSizes = [],
            i, neighbor, minRange, maxRange, maxGrowth, maxShrink, targetSize;

        // if size=100 and minSize=80, we can reduce by 20 so minRange = minSize-size = -20
        minRange = (collapseTarget[minSizeProp] || Math.min(size,defaultSplitMin)) - size;

        // if maxSize=150, maxRange = maxSize - size = 50
        maxRange = collapseTarget[maxSizeProp];
        if (!maxRange) {
            maxRange = 1e9;
        } else {
            maxRange -= size;
        }
        targetSize = size;

        for (i = 0; i < length; ++i) {
            neighbor = neighbors[i];
            size = neighbor[getSizeMethod]();
            //neighborSizes.push(size);

            maxGrowth = size - neighbor[maxSizeProp]; // NaN if no maxSize or negative
            maxShrink = size - (neighbor[minSizeProp] || Math.min(size,defaultSplitMin));

            if (!isNaN(maxGrowth)) {
                // if neighbor can only grow by 10 (maxGrowth = -10), minRange cannot be
                // -20 anymore, but now only -10:
                if (minRange < maxGrowth) {
                    minRange = maxGrowth;
                }
            }

            // if neighbor can shrink by 20 (maxShrink=20), maxRange cannot be 50 anymore,
            // but now only 20:
            if (maxRange > maxShrink) {
                maxRange = maxShrink;
            }
        }

        if (maxRange - minRange < 2) {
            return null;
        }

        box = new Ext.util.Region(top, right, bottom, left);

        me.constraintAdjusters[me.getCollapseDirection()](box, minRange, maxRange, splitter);

        me.dragInfo = {
            minRange: minRange,
            maxRange: maxRange,
            //neighborSizes: neighborSizes,
            targetSize: targetSize
        };

        return box;
    },

    constraintAdjusters: {
        // splitter is to the right of the box
        left: function (box, minRange, maxRange, splitter) {
            box[0] = box.x = box.left = box.right + minRange;
            box.right += maxRange + splitter.getWidth();
        },

        // splitter is below the box
        top: function (box, minRange, maxRange, splitter) {
            box[1] = box.y = box.top = box.bottom + minRange;
            box.bottom += maxRange + splitter.getHeight();
        },

        // splitter is above the box
        bottom: function (box, minRange, maxRange, splitter) {
            box.bottom = box.top - minRange;
            box.top -= maxRange + splitter.getHeight();
        },

        // splitter is to the left of the box
        right: function (box, minRange, maxRange, splitter) {
            box.right = box.left - minRange;
            box[0] = box.x = box.left = box.x - maxRange + splitter.getWidth();
        }
    },

    onBeforeStart: function(e) {
        var me = this,
            splitter = me.splitter,
            collapseTarget = splitter.collapseTarget,
            neighbors = splitter.neighbors,
            collapseEl = me.getSplitter().collapseEl,
            target = e.getTarget(),
            length = neighbors.length,
            i, neighbor;

        if (collapseEl && target === splitter.collapseEl.dom) {
            return false;
        }

        if (collapseTarget.collapsed) {
            return false;
        }

        // disabled if any neighbors are collapsed in parallel direction.
        for (i = 0; i < length; ++i) {
            neighbor = neighbors[i];

            if (neighbor.collapsed && neighbor.isHorz === collapseTarget.isHorz) {
                return false;
            }
        }

        if (!(me.constrainTo = me.calculateConstrainRegion())) {
            return false;
        }

        return true;
    },

    performResize: function(e, offset) {
        var me = this,
            splitter = me.splitter,
            collapseDirection = splitter.getCollapseDirection(),
            collapseTarget = splitter.collapseTarget,
            // a vertical splitter adjusts horizontal dimensions
            adjusters = me.splitAdjusters[splitter.vertical ? 'horz' : 'vert'],
            delta = offset[adjusters.index],
            dragInfo = me.dragInfo,
            //neighbors = splitter.neighbors,
            //length = neighbors.length,
            //neighborSizes = dragInfo.neighborSizes,
            //isVert = collapseTarget.isVert,
            //i, neighbor,
            owner;

        if (collapseDirection == 'right' || collapseDirection == 'bottom') {
            // these splitters grow by moving left/up, so flip the sign of delta...
            delta = -delta;
        }

        // now constrain delta to our computed range:
        delta = Math.min(Math.max(dragInfo.minRange, delta), dragInfo.maxRange);

        if (delta) {
            (owner = splitter.ownerCt).suspendLayouts();

            adjusters.adjustTarget(collapseTarget, dragInfo.targetSize, delta);

            //for (i = 0; i < length; ++i) {
            //    neighbor = neighbors[i];
            //    if (!neighbor.isCenter && !neighbor.maintainFlex && neighbor.isVert == isVert) {
            //        delete neighbor.flex;
            //        adjusters.adjustNeighbor(neighbor, neighborSizes[i], delta);
            //    }
            //}

            owner.resumeLayouts(true);
        }
    },

    splitAdjusters: {
        horz: {
            index: 0,
            //adjustNeighbor: function (neighbor, size, delta) {
            //    neighbor.setSize(size - delta);
            //},
            adjustTarget: function (target, size, delta) {
                target.flex = null;
                target.setSize(size + delta);
            }
        },
        vert: {
            index: 1,
            //adjustNeighbor: function (neighbor, size, delta) {
            //    neighbor.setSize(undefined, size - delta);
            //},
            adjustTarget: function (target, targetSize, delta) {
                target.flex = null;
                target.setSize(undefined, targetSize + delta);
            }
        }
    },

    getCollapseDirection: function() {
        return this.splitter.getCollapseDirection();
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @author Ed Spencer
 * 
 * Represents a single Tab in a {@link Ext.tab.Panel TabPanel}. A Tab is simply a slightly customized {@link Ext.button.Button Button}, 
 * styled to look like a tab. Tabs are optionally closable, and can also be disabled. 99% of the time you will not
 * need to create Tabs manually as the framework does so automatically when you use a {@link Ext.tab.Panel TabPanel}
 */
Ext.define('Ext.tab.Tab', {
    extend:  Ext.button.Button ,
    alias: 'widget.tab',

               
                         
      

    /**
     * @property {Boolean} isTab
     * `true` in this class to identify an object as an instantiated Tab, or subclass thereof.
     */
    isTab: true,

    baseCls: Ext.baseCSSPrefix + 'tab',
    closeElOverCls: Ext.baseCSSPrefix + 'tab-close-btn-over',

    /**
     * @cfg {String} activeCls
     * The CSS class to be applied to a Tab when it is active.
     * Providing your own CSS for this class enables you to customize the active state.
     */
    activeCls: 'active',

    /**
     * @cfg {String} [disabledCls='x-tab-disabled']
     * The CSS class to be applied to a Tab when it is disabled.
     */

    /**
     * @cfg {String} closableCls
     * The CSS class which is added to the tab when it is closable
     */
    closableCls: 'closable',

    /**
     * @cfg {Boolean} closable
     * True to make the Tab start closable (the close icon will be visible).
     */
    closable: true,

    //<locale>
    /**
     * @cfg {String} closeText
     * The accessible text label for the close button link; only used when {@link #cfg-closable} = true.
     */
    closeText: 'Close Tab',
    //</locale>

    /**
     * @property {Boolean} active
     * Indicates that this tab is currently active. This is NOT a public configuration.
     * @readonly
     */
    active: false,

    /**
     * @property {Boolean} closable
     * True if the tab is currently closable
     */

    childEls: [
        'closeEl'
    ],

    scale: false,

    position: 'top',

    initComponent: function() {
        var me = this;

        me.addEvents(
            /**
             * @event activate
             * Fired when the tab is activated.
             * @param {Ext.tab.Tab} this
             */
            'activate',

            /**
             * @event deactivate
             * Fired when the tab is deactivated.
             * @param {Ext.tab.Tab} this
             */
            'deactivate',

            /**
             * @event beforeclose
             * Fires if the user clicks on the Tab's close button, but before the {@link #close} event is fired. Return
             * false from any listener to stop the close event being fired
             * @param {Ext.tab.Tab} tab The Tab object
             */
            'beforeclose',

            /**
             * @event close
             * Fires to indicate that the tab is to be closed, usually because the user has clicked the close button.
             * @param {Ext.tab.Tab} tab The Tab object
             */
            'close'
        );

        me.callParent(arguments);

        if (me.card) {
            me.setCard(me.card);
        }

        me.overCls = ['over', me.position + '-over'];
    },

    getTemplateArgs: function() {
        var me = this,
            result = me.callParent();

        result.closable = me.closable;
        result.closeText = me.closeText;

        return result;
    },
    
    getFramingInfoCls: function(){
        return this.baseCls + '-' + this.ui + '-' + this.position;
    },

    beforeRender: function() {
        var me = this,
            tabBar = me.up('tabbar'),
            tabPanel = me.up('tabpanel');
        
        me.callParent();
        
        me.addClsWithUI(me.position);

        if (me.active) {
            me.addClsWithUI([me.activeCls, me.position + '-' + me.activeCls]);
        }

        // Set all the state classNames, as they need to include the UI
        // me.disabledCls = me.getClsWithUIs('disabled');

        me.syncClosableUI();

        // Propagate minTabWidth and maxTabWidth settings from the owning TabBar then TabPanel
        if (!me.minWidth) {
            me.minWidth = (tabBar) ? tabBar.minTabWidth : me.minWidth;
            if (!me.minWidth && tabPanel) {
                me.minWidth = tabPanel.minTabWidth;
            }
            if (me.minWidth && me.iconCls) {
                me.minWidth += 25;
            }
        }
        if (!me.maxWidth) {
            me.maxWidth = (tabBar) ? tabBar.maxTabWidth : me.maxWidth;
            if (!me.maxWidth && tabPanel) {
                me.maxWidth = tabPanel.maxTabWidth;
            }
        }
    },

    onRender: function() {
        var me = this;

        me.setElOrientation();

        me.callParent(arguments);

        if (me.closable) {
            me.closeEl.addClsOnOver(me.closeElOverCls);
        }

        me.keyNav = new Ext.util.KeyNav(me.el, {
            enter: me.onEnterKey,
            del: me.onDeleteKey,
            scope: me
        });
    },

    setElOrientation: function() {
        var position = this.position;

        if (position === 'left' || position === 'right') {
            this.el.setVertical(position === 'right' ? 90 : 270);
        }
    },

    // inherit docs
    enable : function(silent) {
        var me = this;

        me.callParent(arguments);

        me.removeClsWithUI(me.position + '-disabled');

        return me;
    },

    // inherit docs
    disable : function(silent) {
        var me = this;

        me.callParent(arguments);

        me.addClsWithUI(me.position + '-disabled');

        return me;
    },

    onDestroy: function() {
        var me = this;

        Ext.destroy(me.keyNav);
        delete me.keyNav;

        me.callParent(arguments);
    },

    /**
     * Sets the tab as either closable or not.
     * @param {Boolean} closable Pass false to make the tab not closable. Otherwise the tab will be made closable (eg a
     * close button will appear on the tab)
     */
    setClosable: function(closable) {
        var me = this;

        // Closable must be true if no args
        closable = (!arguments.length || !!closable);

        if (me.closable != closable) {
            me.closable = closable;

            // set property on the user-facing item ('card'):
            if (me.card) {
                me.card.closable = closable;
            }

            me.syncClosableUI();

            if (me.rendered) {
                me.syncClosableElements();

                // Tab will change width to accommodate close icon
                me.updateLayout();
            }
        }
    },

    /**
     * This method ensures that the closeBtn element exists or not based on 'closable'.
     * @private
     */
    syncClosableElements: function () {
        var me = this,
            closeEl = me.closeEl;

        if (me.closable) {
            if (!closeEl) {
                closeEl = me.closeEl = me.btnWrap.insertSibling({
                    tag: 'a',
                    cls: me.baseCls + '-close-btn',
                    href: '#',
                    title: me.closeText
                }, 'after');
            }
            closeEl.addClsOnOver(me.closeElOverCls);
        } else if (closeEl) {
            closeEl.remove();
            delete me.closeEl;
        }
    },

    /**
     * This method ensures that the UI classes are added or removed based on 'closable'.
     * @private
     */
    syncClosableUI: function () {
        var me = this,
            classes = [me.closableCls, me.closableCls + '-' + me.position];

        if (me.closable) {
            me.addClsWithUI(classes);
        } else {
            me.removeClsWithUI(classes);
        }
    },

    /**
     * Sets this tab's attached card. Usually this is handled automatically by the {@link Ext.tab.Panel} that this Tab
     * belongs to and would not need to be done by the developer
     * @param {Ext.Component} card The card to set
     */
    setCard: function(card) {
        var me = this;

        me.card = card;
        me.setText(me.title || card.title);
        me.setIconCls(me.iconCls || card.iconCls);
        me.setIcon(me.icon || card.icon);
        me.setGlyph(me.glyph || card.glyph);
    },

    /**
     * @private
     * Listener attached to click events on the Tab's close button
     */
    onCloseClick: function() {
        var me = this;

        if (me.fireEvent('beforeclose', me) !== false) {
            if (me.tabBar) {
                if (me.tabBar.closeTab(me) === false) {
                    // beforeclose on the panel vetoed the event, stop here
                    return;
                }
            } else {
                // if there's no tabbar, fire the close event
                me.fireClose();
            }
        }
    },

    /**
     * Fires the close event on the tab.
     * @private
     */
    fireClose: function(){
        this.fireEvent('close', this);
    },

    /**
     * @private
     */
    onEnterKey: function(e) {
        var me = this;

        if (me.tabBar) {
            me.tabBar.onClick(e, me.el);
        }
    },

   /**
     * @private
     */
    onDeleteKey: function(e) {
        if (this.closable) {
            this.onCloseClick();
        }
    },

    // @private
    activate : function(supressEvent) {
        var me = this;

        me.active = true;
        me.addClsWithUI([me.activeCls, me.position + '-' + me.activeCls]);

        if (supressEvent !== true) {
            me.fireEvent('activate', me);
        }
    },

    // @private
    deactivate : function(supressEvent) {
        var me = this;

        me.active = false;
        me.removeClsWithUI([me.activeCls, me.position + '-' + me.activeCls]);

        if (supressEvent !== true) {
            me.fireEvent('deactivate', me);
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @author Ed Spencer
 * TabBar is used internally by a {@link Ext.tab.Panel TabPanel} and typically should not need to be created manually.
 * The tab bar automatically removes the default title provided by {@link Ext.panel.Header}
 */
Ext.define('Ext.tab.Bar', {
    extend:  Ext.panel.Header ,
    alias: 'widget.tabbar',
    baseCls: Ext.baseCSSPrefix + 'tab-bar',

               
                      
                        
      

    /**
     * @property {Boolean} isTabBar
     * `true` in this class to identify an object as an instantiated Tab Bar, or subclass thereof.
     */
    isTabBar: true,
    
    /**
     * @cfg {String} title @hide
     */
    
    /**
     * @cfg {String} iconCls @hide
     */

    // @private
    defaultType: 'tab',

    /**
     * @cfg {Boolean} plain
     * True to not show the full background on the tabbar
     */
    plain: false,

    childEls: [
        'body', 'strip'
    ],

    // @private
    renderTpl: [
        '<div id="{id}-body" class="{baseCls}-body {bodyCls} {bodyTargetCls}{childElCls}<tpl if="ui"> {baseCls}-body-{ui}<tpl for="uiCls"> {parent.baseCls}-body-{parent.ui}-{.}</tpl></tpl>"<tpl if="bodyStyle"> style="{bodyStyle}"</tpl>>',
            '{%this.renderContainer(out,values)%}',
        '</div>',
        '<div id="{id}-strip" class="{baseCls}-strip {baseCls}-strip-{dock}{childElCls}',
            '<tpl if="ui"> {baseCls}-strip-{ui}',
                '<tpl for="uiCls"> {parent.baseCls}-strip-{parent.ui}-{.}</tpl>',
            '</tpl>">',
        '</div>'
    ],

    /**
     * @cfg {Number} minTabWidth
     * The minimum width for a tab in this tab Bar. Defaults to the tab Panel's {@link Ext.tab.Panel#minTabWidth minTabWidth} value.
     * @deprecated This config is deprecated. It is much easier to use the {@link Ext.tab.Panel#minTabWidth minTabWidth} config on the TabPanel.
     */

    /**
     * @cfg {Number} maxTabWidth
     * The maximum width for a tab in this tab Bar. Defaults to the tab Panel's {@link Ext.tab.Panel#maxTabWidth maxTabWidth} value.
     * @deprecated This config is deprecated. It is much easier to use the {@link Ext.tab.Panel#maxTabWidth maxTabWidth} config on the TabPanel.
     */

    _reverseDockNames: {
        left: 'right',
        right: 'left'
    },

    // @private
    initComponent: function() {
        var me = this;

        if (me.plain) {
            me.addCls(me.baseCls + '-plain');
        }

        me.addClsWithUI(me.orientation);

        me.addEvents(
            /**
             * @event change
             * Fired when the currently-active tab has changed
             * @param {Ext.tab.Bar} tabBar The TabBar
             * @param {Ext.tab.Tab} tab The new Tab
             * @param {Ext.Component} card The card that was just shown in the TabPanel
             */
            'change'
        );

        // Element onClick listener added by Header base class
        me.callParent(arguments);
        Ext.merge(me.layout, me.initialConfig.layout);

        // TabBar must override the Header's align setting.
        me.layout.align = (me.orientation == 'vertical') ? 'left' : 'top';
        me.layout.overflowHandler = new Ext.layout.container.boxOverflow.Scroller(me.layout);

        me.remove(me.titleCmp);
        delete me.titleCmp;

        Ext.apply(me.renderData, {
            bodyCls: me.bodyCls,
            dock: me.dock
        });
    },

    onRender: function() {
        var me = this;

        me.callParent();

        if (me.orientation === 'vertical' && (Ext.isIE8 || Ext.isIE9) && Ext.isStrict) {
            me.el.on({
                mousemove: me.onMouseMove, 
                scope: me
            });
        }
    },

    afterRender: function() {
        var layout = this.layout;

        this.callParent();
        if (Ext.isIE9 && Ext.isStrict && this.orientation === 'vertical') {
            // EXTJSIV-8765: focusing a vertically-oriented tab in IE9 strict can cause
            // the innerCt to scroll if the tabs have bordering.  
            layout.innerCt.on('scroll', function() {
                layout.innerCt.dom.scrollLeft = 0;
            });
        }
    },

    afterLayout: function() {
        this.adjustTabPositions();
        this.callParent(arguments);
    },

    adjustTabPositions: function() {
        var items = this.items.items,
            i = items.length,
            tab;

        // When tabs are rotated vertically we don't have a reliable way to position
        // them using CSS in modern browsers.  This is because of the way transform-orign
        // works - it requires the width to be known, and the width is not known in css.
        // Consequently we have to make an adjustment to the tab's position in these browsers.
        // This is similar to what we do in Ext.panel.Header#adjustTitlePosition
        if (!Ext.isIE9m) {
            if (this.dock === 'right') {
                // rotated 90 degrees around using the top left corner as the axis.
                // tabs need to be shifted to the right by their width
                while (i--) {
                    tab = items[i];
                    if (tab.isVisible()) {
                        tab.el.setStyle('left', tab.lastBox.width + 'px');
                    }
                }
            } else if (this.dock === 'left') {
                // rotated 270 degrees around using the top left corner as the axis.
                // tabs need to be shifted down by their height
                while (i--) {
                    tab = items[i];
                    if (tab.isVisible()) {
                        tab.el.setStyle('left', -tab.lastBox.height + 'px');
                    }
                }
            }
        }
    },

    getLayout: function() {
        var me = this;
        me.layout.type = (me.orientation === 'horizontal') ? 'hbox' : 'vbox';
        return me.callParent(arguments);
    },

    // @private
    onAdd: function(tab) {
        tab.position = this.dock;
        this.callParent(arguments);
    },
    
    onRemove: function(tab) {
        var me = this;
        
        if (tab === me.previousTab) {
            me.previousTab = null;
        }
        me.callParent(arguments);    
    },

    afterComponentLayout : function(width) {
        var me = this,
            needsScroll = me.needsScroll;
        
        me.callParent(arguments);
            
        if (needsScroll) {
            me.layout.overflowHandler.scrollToItem(me.activeTab);
        }    
        delete me.needsScroll;
    },

    // @private
    onClick: function(e, target) {
        var me = this,
            tabPanel = me.tabPanel,
            tabEl, tab, isCloseClick, tabInfo;

        if (e.getTarget('.' + Ext.baseCSSPrefix + 'box-scroller')) {
            return;
        }

        if (me.orientation === 'vertical' && (Ext.isIE8 || Ext.isIE9) && Ext.isStrict) {
            tabInfo = me.getTabInfoFromPoint(e.getXY());
            tab = tabInfo.tab;
            isCloseClick = tabInfo.close;
        } else {
            // The target might not be a valid tab el.
            tabEl = e.getTarget('.' + Ext.tab.Tab.prototype.baseCls);
            tab = tabEl && Ext.getCmp(tabEl.id);
            isCloseClick = tab && tab.closeEl && (target === tab.closeEl.dom);
        }

        if (isCloseClick) {
            e.preventDefault();
        }
        if (tab && tab.isDisabled && !tab.isDisabled()) {
            if (tab.closable && isCloseClick) {
                tab.onCloseClick();
            } else {
                if (tabPanel) {
                    // TabPanel will card setActiveTab of the TabBar
                    tabPanel.setActiveTab(tab.card);
                } else {
                    me.setActiveTab(tab);
                }
                tab.focus();
            }
        }
    },

    // private
    onMouseMove: function(e) {
        var me = this,
            overTab = me._overTab,
            tabInfo, tab;

        if (e.getTarget('.' + Ext.baseCSSPrefix + 'box-scroller')) {
            return;
        }

        tabInfo = me.getTabInfoFromPoint(e.getXY());
        tab = tabInfo.tab;

        if (tab !== overTab) {
            if (overTab && overTab.rendered) {
                overTab.onMouseLeave(e);
                me._overTab = null;
            }
            if (tab) {
                tab.onMouseEnter(e);
                me._overTab = tab;
                if (!tab.disabled) {
                    me.el.setStyle('cursor', 'pointer');
                }
            } else {
                me.el.setStyle('cursor', 'default');
            }
        }
    },

    onMouseLeave: function(e) {
        var overTab = this._overTab;

        if (overTab && overTab.rendered) {
            overTab.onMouseLeave(e);
        }
    },

    // @private
    // in IE8 and IE9 the clickable region of a rotated element is not its new rotated
    // position, but it's original unrotated position.  The result is that rotated tabs do
    // not capture click and mousenter/mosueleave events correctly.  This method accepts
    // an xy position and calculates if the coordinates are within a tab and if they
    // are within the tab's close icon (if any)
    getTabInfoFromPoint: function(xy) {
        var me = this,
            tabs = me.items.items,
            length = tabs.length,
            innerCt = me.layout.innerCt,
            innerCtXY = innerCt.getXY(),
            point = new Ext.util.Point(xy[0], xy[1]),
            i = 0,
            lastBox, tabRegion, closeEl, close, closeXY, closeX, closeY, closeWidth,
            closeHeight, tabX, tabY, tabWidth, tabHeight, closeRegion, isTabReversed,
            direction, tab;

        for (; i < length; i++) {
            lastBox = tabs[i].lastBox;
            tabX = innerCtXY[0] + lastBox.x;
            tabY = innerCtXY[1] - innerCt.dom.scrollTop + lastBox.y;
            tabWidth = lastBox.width;
            tabHeight = lastBox.height;
            tabRegion = new Ext.util.Region(
                tabY,
                tabX + tabWidth,
                tabY + tabHeight,
                tabX
            );
            if (tabRegion.contains(point)) {
                tab = tabs[i];
                closeEl = tab.closeEl;
                if (closeEl) {
                    closeXY = closeEl.getXY();
                    closeWidth = closeEl.getWidth();
                    closeHeight = closeEl.getHeight();
                    // Read the dom to determine if the contents of the tab are reversed
                    // (rotated 180 degrees).  If so, we can cache the result becuase
                    // it's safe to assume all tabs in the tabbar will be the same
                    if (me._isTabReversed === undefined) {
                        me._isTabReversed = isTabReversed =
                        // use currentStyle because getComputedStyle won't get the
                        // filter property in IE9
                        (tab.btnWrap.dom.currentStyle.filter.indexOf('rotation=2') !== -1);
                    }

                    direction = isTabReversed ? this._reverseDockNames[me.dock] : me.dock;

                    if (direction === 'right') {
                        closeX = tabX + tabWidth - ((closeXY[1] - tabY) + closeEl.getHeight()); 
                        closeY = tabY + (closeXY[0] - tabX); 
                    } else {
                        closeX = tabX + (closeXY[1] - tabY);
                        closeY = tabY + tabX + tabHeight - closeXY[0] - closeEl.getWidth();
                    }
                        
                    closeRegion = new Ext.util.Region(
                        closeY,
                        closeX + closeWidth,
                        closeY + closeHeight,
                        closeX
                    );

                    close = closeRegion.contains(point);
                }
                break;
            }
        }
            
        return {
            tab: tab,
            close: close
        };
    },

    /**
     * @private
     * Closes the given tab by removing it from the TabBar and removing the corresponding card from the TabPanel
     * @param {Ext.tab.Tab} toClose The tab to close
     */
    closeTab: function(toClose) {
        var me = this,
            card = toClose.card,
            tabPanel = me.tabPanel,
            toActivate;

        if (card && card.fireEvent('beforeclose', card) === false) {
            return false;
        }
        
        // If we are closing the active tab, revert to the previously active tab (or the previous or next enabled sibling if
        // there *is* no previously active tab, or the previously active tab is the one that's being closed or the previously
        // active tab has since been disabled)
        toActivate = me.findNextActivatable(toClose);

        // We are going to remove the associated card, and then, if that was sucessful, remove the Tab,
        // And then potentially activate another Tab. We should not layout for each of these operations.
        Ext.suspendLayouts();

        if (tabPanel && card) {
            // Remove the ownerCt so the tab doesn't get destroyed if the remove is successful
            // We need this so we can have the tab fire it's own close event.
            delete toClose.ownerCt;
            
            // we must fire 'close' before removing the card from panel, otherwise
            // the event will no loger have any listener
            card.fireEvent('close', card);
            tabPanel.remove(card);
            
            // Remove succeeded
            if (!tabPanel.getComponent(card)) {
                /*
                 * Force the close event to fire. By the time this function returns,
                 * the tab is already destroyed and all listeners have been purged
                 * so the tab can't fire itself.
                 */
                toClose.fireClose();
                me.remove(toClose);
            } else {
                // Restore the ownerCt from above
                toClose.ownerCt = me;
                Ext.resumeLayouts(true);
                return false;
            }
        }

        // If we are closing the active tab, revert to the previously active tab (or the previous sibling or the nnext sibling)
        if (toActivate) {
            // Our owning TabPanel calls our setActiveTab method, so only call that if this Bar is being used
            // in some other context (unlikely)
            if (tabPanel) {
                tabPanel.setActiveTab(toActivate.card);
            } else {
                me.setActiveTab(toActivate);
            }
            toActivate.focus();
        }
        Ext.resumeLayouts(true);
    },

    // private - used by TabPanel too.
    // Works out the next tab to activate when one tab is closed.
    findNextActivatable: function(toClose) {
        var me = this;
        if (toClose.active && me.items.getCount() > 1) {
            return (me.previousTab && me.previousTab !== toClose && !me.previousTab.disabled) ? me.previousTab : (toClose.next('tab[disabled=false]') || toClose.prev('tab[disabled=false]'));
        }
    },

    /**
     * @private
     * Marks the given tab as active
     * @param {Ext.tab.Tab} tab The tab to mark active
     * @param {Boolean} initial True if we're setting the tab during setup
     */
    setActiveTab: function(tab, initial) {
        var me = this;

        if (!tab.disabled && tab !== me.activeTab) {
            if (me.activeTab) {
                if (me.activeTab.isDestroyed) {
                    me.previousTab = null;
                } else {
                    me.previousTab = me.activeTab;
                    me.activeTab.deactivate();
                }
            }
            tab.activate();

            me.activeTab = tab;
            me.needsScroll = true;
            
            // We don't fire the change event when setting the first tab.
            // Also no need to run a layout
            if (!initial) {
                me.fireEvent('change', me, tab, tab.card);
                // Ensure that after the currently in progress layout, the active tab is scrolled into view
                me.updateLayout();
            }
        }
    }
});

/*
This file is part of Ext JS 4.2

Copyright (c) 2011-2013 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as
published by the Free Software Foundation and appearing in the file LICENSE included in the
packaging of this file.

Please review the following information to ensure the GNU General Public License version 3.0
requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department
at http://www.sencha.com/contact.

Build date: 2013-05-16 14:36:50 (f9be68accb407158ba2b1be2c226a6ce1f649314)
*/
/**
 * @author Ed Spencer, Tommy Maintz, Brian Moeskau
 *
 * A basic tab container. TabPanels can be used exactly like a standard {@link Ext.panel.Panel} for
 * layout purposes, but also have special support for containing child Components
 * (`{@link Ext.container.Container#cfg-items items}`) that are managed using a
 * {@link Ext.layout.container.Card CardLayout layout manager}, and displayed as separate tabs.
 *
 * **Note:** By default, a tab's close tool _destroys_ the child tab Component and all its descendants.
 * This makes the child tab Component, and all its descendants **unusable**.  To enable re-use of a tab,
 * configure the TabPanel with `{@link #autoDestroy autoDestroy: false}`.
 *
 * ## TabPanel's layout
 *
 * TabPanels use a Dock layout to position the {@link Ext.tab.Bar TabBar} at the top of the widget.
 * Panels added to the TabPanel will have their header hidden by default because the Tab will
 * automatically take the Panel's configured title and icon.
 *
 * TabPanels use their {@link Ext.panel.Header header} or {@link Ext.panel.Panel#fbar footer}
 * element (depending on the {@link #tabPosition} configuration) to accommodate the tab selector buttons.
 * This means that a TabPanel will not display any configured title, and will not display any configured
 * header {@link Ext.panel.Panel#tools tools}.
 *
 * To display a header, embed the TabPanel in a {@link Ext.panel.Panel Panel} which uses
 * `{@link Ext.container.Container#layout layout: 'fit'}`.
 *
 * ## Controlling tabs
 *
 * Configuration options for the {@link Ext.tab.Tab} that represents the component can be passed in
 * by specifying the tabConfig option:
 *
 *     @example
 *     Ext.create('Ext.tab.Panel', {
 *         width: 400,
 *         height: 400,
 *         renderTo: document.body,
 *         items: [{
 *             title: 'Foo'
 *         }, {
 *             title: 'Bar',
 *             tabConfig: {
 *                 title: 'Custom Title',
 *                 tooltip: 'A button tooltip'
 *             }
 *         }]
 *     });
 * 
 * ## Vetoing Changes
 * 
 * User interaction when changing the tabs can be vetoed by listening to the {@link #beforetabchange} event.
 * By returning `false`, the tab change will not occur.
 * 
 *     @example
 *     Ext.create('Ext.tab.Panel', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         listeners: {
 *             beforetabchange: function(tabs, newTab, oldTab) {
 *                 return newTab.title != 'P2';
 *             }
 *         },
 *         items: [{
 *             title: 'P1'
 *         }, {
 *             title: 'P2'
 *         }, {
 *             title: 'P3'
 *         }]
 *     }); 
 *
 * # Examples
 *
 * Here is a basic TabPanel rendered to the body. This also shows the useful configuration {@link #activeTab},
 * which allows you to set the active tab on render. If you do not set an {@link #activeTab}, no tabs will be
 * active by default.
 *
 *     @example
 *     Ext.create('Ext.tab.Panel', {
 *         width: 300,
 *         height: 200,
 *         activeTab: 0,
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 bodyPadding: 10,
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 * It is easy to control the visibility of items in the tab bar. Specify hidden: true to have the
 * tab button hidden initially. Items can be subsequently hidden and show by accessing the
 * tab property on the child item.
 *
 *     @example
 *     var tabs = Ext.create('Ext.tab.Panel', {
 *         width: 400,
 *         height: 400,
 *         renderTo: document.body,
 *         items: [{
 *             title: 'Home',
 *             html: 'Home',
 *             itemId: 'home'
 *         }, {
 *             title: 'Users',
 *             html: 'Users',
 *             itemId: 'users',
 *             hidden: true
 *         }, {
 *             title: 'Tickets',
 *             html: 'Tickets',
 *             itemId: 'tickets'
 *         }]
 *     });
 *
 *     setTimeout(function(){
 *         tabs.child('#home').tab.hide();
 *         var users = tabs.child('#users');
 *         users.tab.show();
 *         tabs.setActiveTab(users);
 *     }, 1000);
 *
 * You can remove the background of the TabBar by setting the {@link #plain} property to `true`.
 *
 *     @example
 *     Ext.create('Ext.tab.Panel', {
 *         width: 300,
 *         height: 200,
 *         activeTab: 0,
 *         plain: true,
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 bodyPadding: 10,
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 * Another useful configuration of TabPanel is {@link #tabPosition}. This allows you to change the
 * position where the tabs are displayed. The available options for this are `'top'` (default) and
 * `'bottom'`.
 *
 *     @example
 *     Ext.create('Ext.tab.Panel', {
 *         width: 300,
 *         height: 200,
 *         activeTab: 0,
 *         bodyPadding: 10,
 *         tabPosition: 'bottom',
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 * The {@link #setActiveTab} is a very useful method in TabPanel which will allow you to change the
 * current active tab. You can either give it an index or an instance of a tab. For example:
 *
 *     @example
 *     var tabs = Ext.create('Ext.tab.Panel', {
 *         items: [
 *             {
 *                 id   : 'my-tab',
 *                 title: 'Tab 1',
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 *     var tab = Ext.getCmp('my-tab');
 *
 *     Ext.create('Ext.button.Button', {
 *         renderTo: Ext.getBody(),
 *         text    : 'Select the first tab',
 *         scope   : this,
 *         handler : function() {
 *             tabs.setActiveTab(tab);
 *         }
 *     });
 *
 *     Ext.create('Ext.button.Button', {
 *         text    : 'Select the second tab',
 *         scope   : this,
 *         handler : function() {
 *             tabs.setActiveTab(1);
 *         },
 *         renderTo : Ext.getBody()
 *     });
 *
 * The {@link #getActiveTab} is a another useful method in TabPanel which will return the current active tab.
 *
 *     @example
 *     var tabs = Ext.create('Ext.tab.Panel', {
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 *     Ext.create('Ext.button.Button', {
 *         text    : 'Get active tab',
 *         scope   : this,
 *         handler : function() {
 *             var tab = tabs.getActiveTab();
 *             alert('Current tab: ' + tab.title);
 *         },
 *         renderTo : Ext.getBody()
 *     });
 *
 * Adding a new tab is very simple with a TabPanel. You simple call the {@link #method-add} method with an config
 * object for a panel.
 *
 *     @example
 *     var tabs = Ext.create('Ext.tab.Panel', {
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 *     Ext.create('Ext.button.Button', {
 *         text    : 'New tab',
 *         scope   : this,
 *         handler : function() {
 *             var tab = tabs.add({
 *                 // we use the tabs.items property to get the length of current items/tabs
 *                 title: 'Tab ' + (tabs.items.length + 1),
 *                 html : 'Another one'
 *             });
 *
 *             tabs.setActiveTab(tab);
 *         },
 *         renderTo : Ext.getBody()
 *     });
 *
 * Additionally, removing a tab is very also simple with a TabPanel. You simple call the {@link #method-remove} method
 * with an config object for a panel.
 *
 *     @example
 *     var tabs = Ext.create('Ext.tab.Panel', {
 *         items: [
 *             {
 *                 title: 'Tab 1',
 *                 html : 'A simple tab'
 *             },
 *             {
 *                 id   : 'remove-this-tab',
 *                 title: 'Tab 2',
 *                 html : 'Another one'
 *             }
 *         ],
 *         renderTo : Ext.getBody()
 *     });
 *
 *     Ext.create('Ext.button.Button', {
 *         text    : 'Remove tab',
 *         scope   : this,
 *         handler : function() {
 *             var tab = Ext.getCmp('remove-this-tab');
 *             tabs.remove(tab);
 *         },
 *         renderTo : Ext.getBody()
 *     });
 */
Ext.define('Ext.tab.Panel', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.tabpanel',
    alternateClassName: ['Ext.TabPanel'],

                                                           

    /**
     * @cfg {"top"/"bottom"/"left"/"right"} tabPosition
     * The position where the tab strip should be rendered. Can be `top`, `bottom`,
     * `left` or `right`
     */
    tabPosition : 'top',

    /**
     * @cfg {String/Number} activeItem
     * Doesn't apply for {@link Ext.tab.Panel TabPanel}, use {@link #activeTab} instead.
     */

    /**
     * @cfg {String/Number/Ext.Component} activeTab
     * The tab to activate initially. Either an ID, index or the tab component itself.
     */

    /**
     * @cfg {Object} tabBar
     * Optional configuration object for the internal {@link Ext.tab.Bar}.
     * If present, this is passed straight through to the TabBar's constructor
     */

    /**
     * @cfg {Ext.enums.Layout/Object} layout
     * Optional configuration object for the internal {@link Ext.layout.container.Card card layout}.
     * If present, this is passed straight through to the layout's constructor
     */

    /**
     * @cfg {Boolean} removePanelHeader
     * True to instruct each Panel added to the TabContainer to not render its header element.
     * This is to ensure that the title of the panel does not appear twice.
     */
    removePanelHeader: true,

    /**
     * @cfg {Boolean} plain
     * True to not show the full background on the TabBar.
     */
    plain: false,

    /**
     * @cfg {String} [itemCls='x-tabpanel-child']
     * The class added to each child item of this TabPanel.
     */
    itemCls: Ext.baseCSSPrefix + 'tabpanel-child',

    /**
     * @cfg {Number} minTabWidth
     * The minimum width for a tab in the {@link #cfg-tabBar}.
     */
    minTabWidth: undefined,

    /**
     * @cfg {Number} maxTabWidth The maximum width for each tab.
     */
    maxTabWidth: undefined,

    /**
     * @cfg {Boolean} deferredRender
     *
     * True by default to defer the rendering of child {@link Ext.container.Container#cfg-items items} to the browsers DOM
     * until a tab is activated. False will render all contained {@link Ext.container.Container#cfg-items items} as soon as
     * the {@link Ext.layout.container.Card layout} is rendered. If there is a significant amount of content or a lot of
     * heavy controls being rendered into panels that are not displayed by default, setting this to true might improve
     * performance.
     *
     * The deferredRender property is internally passed to the layout manager for TabPanels ({@link
     * Ext.layout.container.Card}) as its {@link Ext.layout.container.Card#deferredRender} configuration value.
     *
     * **Note**: leaving deferredRender as true means that the content within an unactivated tab will not be available
     */
    deferredRender : true,

    //inherit docs
    initComponent: function() {
        var me = this,
            dockedItems = [].concat(me.dockedItems || []),
            activeTab = me.activeTab || (me.activeTab = 0),
            tabPosition = me.tabPosition;

        // Configure the layout with our deferredRender, and with our activeTeb
        me.layout = new Ext.layout.container.Card(Ext.apply({
            owner: me,
            deferredRender: me.deferredRender,
            itemCls: me.itemCls,
            activeItem: activeTab
        }, me.layout));

        /**
         * @property {Ext.tab.Bar} tabBar Internal reference to the docked TabBar
         */
        me.tabBar = new Ext.tab.Bar(Ext.apply({
            ui: me.ui,
            dock: me.tabPosition,
            orientation: (tabPosition == 'top' || tabPosition == 'bottom') ? 'horizontal' : 'vertical',
            plain: me.plain,
            cardLayout: me.layout,
            tabPanel: me
        }, me.tabBar));

        dockedItems.push(me.tabBar);
        me.dockedItems = dockedItems;

        me.addEvents(
            /**
             * @event
             * Fires before a tab change (activated by {@link #setActiveTab}). Return false in any listener to cancel
             * the tabchange
             * @param {Ext.tab.Panel} tabPanel The TabPanel
             * @param {Ext.Component} newCard The card that is about to be activated
             * @param {Ext.Component} oldCard The card that is currently active
             */
            'beforetabchange',

            /**
             * @event
             * Fires when a new tab has been activated (activated by {@link #setActiveTab}).
             * @param {Ext.tab.Panel} tabPanel The TabPanel
             * @param {Ext.Component} newCard The newly activated item
             * @param {Ext.Component} oldCard The previously active item
             */
            'tabchange'
        );

        me.callParent(arguments);

        // We have to convert the numeric index/string ID config into its component reference
        activeTab = me.activeTab = me.getComponent(activeTab);

        // Ensure that the active child's tab is rendered in the active UI state
        if (activeTab) {
        	me.tabBar.setActiveTab(activeTab.tab, true);
        }
    },

    /**
     * Makes the given card active. Makes it the visible card in the TabPanel's CardLayout and highlights the Tab.
     * @param {String/Number/Ext.Component} card The card to make active. Either an ID, index or the component itself.
     * @return {Ext.Component} The resulting active child Component. The call may have been vetoed, or otherwise
     * modified by an event listener.
     */
    setActiveTab: function(card) {
        var me = this,
            previous;

        card = me.getComponent(card);
        if (card) {
            previous = me.getActiveTab();

            if (previous !== card && me.fireEvent('beforetabchange', me, card, previous) === false) {
                return false;
            }

            // We may be passed a config object, so add it.
            // Without doing a layout!
            if (!card.isComponent) {
                Ext.suspendLayouts();
                card = me.add(card);
                Ext.resumeLayouts();
            }

            // MUST set the activeTab first so that the machinery which listens for show doesn't
            // think that the show is "driving" the activation and attempt to recurse into here.
            me.activeTab = card;

            // Attempt to switch to the requested card. Suspend layouts because if that was successful
            // we have to also update the active tab in the tab bar which is another layout operation
            // and we must coalesce them.
            Ext.suspendLayouts();
            me.layout.setActiveItem(card);

            // Read the result of the card layout. Events dear boy, events!
            card = me.activeTab = me.layout.getActiveItem();

            // Card switch was not vetoed by an event listener
            if (card && card !== previous) {

                // Update the active tab in the tab bar and resume layouts.
                me.tabBar.setActiveTab(card.tab);
                Ext.resumeLayouts(true);

                // previous will be undefined or this.activeTab at instantiation
                if (previous !== card) {
                    me.fireEvent('tabchange', me, card, previous);
                }
            }
            // Card switch was vetoed by an event listener. Resume layouts (Nothing should have changed on a veto).
            else {
                Ext.resumeLayouts(true);
            }
            return card;
        }
    },

    /**
     * Returns the item that is currently active inside this TabPanel.
     * @return {Ext.Component} The currently active item.
     */
    getActiveTab: function() {
        var me = this,
            // Ensure the calculated result references a Component
            result = me.getComponent(me.activeTab);

        // Sanitize the result in case the active tab is no longer there.
        if (result && me.items.indexOf(result) != -1) {
            me.activeTab = result;
        } else {
            me.activeTab = null;
        }

        return me.activeTab;
    },

    /**
     * Returns the {@link Ext.tab.Bar} currently used in this TabPanel
     * @return {Ext.tab.Bar} The TabBar
     */
    getTabBar: function() {
        return this.tabBar;
    },

    /**
     * @protected
     * Makes sure we have a Tab for each item added to the TabPanel
     */
    onAdd: function(item, index) {
        var me = this,
            cfg = item.tabConfig || {},
            defaultConfig = {
                xtype: 'tab',
                ui: me.tabBar.ui,
                card: item,
                disabled: item.disabled,
                closable: item.closable,
                hidden: item.hidden && !item.hiddenByLayout, // only hide if it wasn't hidden by the layout itself
                tooltip: item.tooltip,
                tabBar: me.tabBar,
                position: me.tabPosition,
                closeText: item.closeText
            };

        cfg = Ext.applyIf(cfg, defaultConfig);

        // Create the correspondiong tab in the tab bar
        item.tab = me.tabBar.insert(index, cfg);

        item.on({
            scope : me,
            enable: me.onItemEnable,
            disable: me.onItemDisable,
            beforeshow: me.onItemBeforeShow,
            iconchange: me.onItemIconChange,
            iconclschange: me.onItemIconClsChange,
            titlechange: me.onItemTitleChange
        });

        if (item.isPanel) {
            if (me.removePanelHeader) {
                if (item.rendered) {
                    if (item.header) {
                        item.header.hide();
                    }
                } else {
                    item.header = false;
                }
            }
            if (item.isPanel && me.border) {
                item.setBorder(false);
            }
        }
    },

    /**
     * @private
     * Enable corresponding tab when item is enabled.
     */
    onItemEnable: function(item){
        item.tab.enable();
    },

    /**
     * @private
     * Disable corresponding tab when item is enabled.
     */
    onItemDisable: function(item){
        item.tab.disable();
    },

    /**
     * @private
     * Sets activeTab before item is shown.
     */
    onItemBeforeShow: function(item) {
        if (item !== this.activeTab) {
            this.setActiveTab(item);
            return false;
        }
    },

    /**
     * @private
     * Update the tab icon when panel icon has been set or changed.
     */
    onItemIconChange: function(item, newIcon) {
        item.tab.setIcon(newIcon);
    },
    
    /**
     * @private
     * Update the tab iconCls when panel iconCls has been set or changed.
     */
    onItemIconClsChange: function(item, newIconCls) {
        item.tab.setIconCls(newIconCls);
    },

    /**
     * @private
     * Update the tab title when panel title has been set or changed.
     */
    onItemTitleChange: function(item, newTitle) {
        item.tab.setText(newTitle);
    },

    /**
     * @private
     * Unlink the removed child item from its (@link Ext.tab.Tab Tab}.
     * 
     * If we're removing the currently active tab, activate the nearest one. The item is removed when we call super,
     * so we can do preprocessing before then to find the card's index
     */
    doRemove: function(item, autoDestroy) {
        var me = this,
            toActivate;

        // Destroying, or removing the last item, nothing to activate
        if (me.destroying || me.items.getCount() == 1) {
            me.activeTab = null;
        }

        // Ask the TabBar which tab to activate next.
        // Set the active child panel using the index of that tab
        else if ((toActivate = me.tabBar.items.indexOf(me.tabBar.findNextActivatable(item.tab))) !== -1) {
             me.setActiveTab(toActivate);
        }
        this.callParent(arguments);

        // Remove the two references
        delete item.tab.card;
        delete item.tab;
    },

    /**
     * @private
     * Makes sure we remove the corresponding Tab when an item is removed
     */
    onRemove: function(item, destroying) {
        var me = this;

        item.un({
            scope : me,
            enable: me.onItemEnable,
            disable: me.onItemDisable,
            beforeshow: me.onItemBeforeShow
        });
        if (!me.destroying && item.tab.ownerCt === me.tabBar) {
            me.tabBar.remove(item.tab);
        }
    }
});

/**
 * The Preview enables you to show a configurable preview of a record.
 *
 * This plugin assumes that it has control over the features used for this
 * particular grid section and may conflict with other plugins.
 */
Ext.define('Ext.ux.PreviewPlugin', {
    extend:  Ext.AbstractPlugin ,
    alias: 'plugin.preview',
                                                                       
    
    // private, css class to use to hide the body
    hideBodyCls: 'x-grid-row-body-hidden',
    
    /**
     * @cfg {String} bodyField
     * Field to display in the preview. Must be a field within the Model definition
     * that the store is using.
     */
    bodyField: '',
    
    /**
     * @cfg {Boolean} previewExpanded
     */
    previewExpanded: true,
    
    setCmp: function(grid) {
        this.callParent(arguments);
        
        var bodyField   = this.bodyField,
            hideBodyCls = this.hideBodyCls,
            features    = [{
                ftype: 'rowbody',
                getAdditionalData: function(data, idx, record, orig, view) {
                    var getAdditionalData = Ext.grid.feature.RowBody.prototype.getAdditionalData,
                        additionalData = {
                            rowBody: data[bodyField],
                            rowBodyCls: grid.previewExpanded ? '' : hideBodyCls
                        };
                        
                    if (getAdditionalData) {
                        Ext.apply(additionalData, getAdditionalData.apply(this, arguments));
                    }
                    return additionalData;
                }
            }, {
                ftype: 'rowwrap'
            }];
        
        grid.previewExpanded = this.previewExpanded;
        if (!grid.features) {
            grid.features = [];
        }
        grid.features = features.concat(grid.features);
    },
    
    /**
     * Toggle between the preview being expanded/hidden
     * @param {Boolean} expanded Pass true to expand the record and false to not show the preview.
     */
    toggleExpanded: function(expanded) {
        var view = this.getCmp();
        this.previewExpanded = view.previewExpanded = expanded;
        view.refresh();
    }
});

/** This file acts as a placeholder for all dependencies concatenated, automatically generated when build  */

Ext.define('FV.view.article.Grid', {
    extend:  Ext.grid.Panel ,
    alias: 'widget.articlegrid',

    cls: 'feed-grid',
    disabled: true,

                                                              
    
    border: false,
    
    initComponent: function() {
        Ext.apply(this, {
            store: 'Articles',

            viewConfig: {
                plugins: [{
                    pluginId: 'preview',
                    ptype: 'preview',
                    bodyField: 'description',
                    previewExpanded: true
                }]
            },

            columns: [{
                text: 'Title',
                dataIndex: 'title',
                flex: 1,
                renderer: this.formatTitle
            }, {
                text: 'Author',
                dataIndex: 'author',
                hidden: true,
                width: 200
            }, {
                text: 'Date',
                dataIndex: 'pubDate',
                renderer: this.formatDate,
                width: 200
            }],
            dockedItems:[{
                xtype: 'toolbar',
                dock: 'top',
                items: [{
                    iconCls: 'open-all',
                    text: 'Open All',
                    action: 'openall'
                }]
            }]
        });

        this.callParent(arguments);
    },

    /**
     * Title renderer
     * @private
     */
    formatTitle: function(value, p, record) {
        return Ext.String.format('<div class="topic"><b>{0}</b><span class="author">{1}</span></div>', value, record.get('author') || "Unknown");
    },

    /**
     * Date renderer
     * @private
     */
    formatDate: function(date) {
        if (!date) {
            return '';
        }

        var now = new Date(),
            d = Ext.Date.clearTime(now, true),
            notime = Ext.Date.clearTime(date, true).getTime();

        if (notime === d.getTime()) {
            return 'Today ' + Ext.Date.format(date, 'g:i a');
        }

        d = Ext.Date.add(d, 'd', -6);
        if (d.getTime() <= notime) {
            return Ext.Date.format(date, 'D g:i a');
        }
        return Ext.Date.format(date, 'Y/m/d g:i a');
    }
});

Ext.define('FV.view.article.Preview', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.articlepreview',

                                      

    cls: 'preview',
    autoScroll: true,
    border: false,
    
    initComponent: function() {
        Ext.apply(this, {
            tpl: new Ext.XTemplate(
                '<div class="post-data">',
                    '<span class="post-date">{pubDate:this.formatDate}</span>',
                    '<h3 class="post-title">{title}</h3>',
                    '<h4 class="post-author">by {author:this.defaultValue}</h4>',
                '</div>',
                '<div class="post-body">{content:this.getBody}</div>', {

                getBody: function(value, all) {
                    return Ext.util.Format.stripScripts(value);
                },

                defaultValue: function(v) {
                    return v ? v : 'Unknown';
                },

                formatDate: function(value) {
                    if (!value) {
                        return '';
                    }
                    return Ext.Date.format(value, 'M j, Y, g:i a');
                }
            }),

            dockedItems: [{
                dock: 'top',
                xtype: 'toolbar',
                items: [{
                    iconCls: 'tab-new',
                    text: 'View in new tab',
                    action: 'viewintab'
                }, {
                    iconCls: 'post-go',
                    text: 'Go to post',
                    action: 'gotopost'
                }]
            }]
        });

        this.callParent(arguments);
    }
});

Ext.define('FV.view.feed.Show', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.feedshow',

               
                               
                                 
      

    closable: false,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    initComponent: function() {
        Ext.apply(this, {
            items: [{
                xtype: 'articlegrid',
                flex: 1
            },{
                xtype: 'articlepreview',
                cls: 'articlepreview',
                height: 300
            }]
        });

        this.callParent(arguments);
    }
});

Ext.define('FV.view.Viewer', {
    extend:  Ext.tab.Panel ,
    alias: 'widget.viewer',
    
                                    
    
    activeItem: 0,
    margins: '5 5 5 5',
    
    cls: 'preview',
    
    initComponent: function() {
        this.items = [{
            xtype: 'feedshow',
            title: 'Sencha Blog'
        }];
        
        this.callParent(arguments);
    }
});

Ext.define('FV.view.feed.List', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.feedlist',

                                      

    title: 'Feeds',
    collapsible: true,
    animCollapse: true,
    margins: '5 0 5 5',
    layout: 'fit',

    initComponent: function() {
        Ext.apply(this, {
            items: [{
                xtype: 'dataview',
                trackOver: true,
                store: this.store,
                cls: 'feed-list',
                itemSelector: '.feed-list-item',
                overItemCls: 'feed-list-item-hover',
                tpl: '<tpl for="."><div class="feed-list-item">{name}</div></tpl>',
                listeners: {
                    selectionchange: this.onSelectionChange,
                    scope: this
                }
            }],

            dockedItems: [{
                xtype: 'toolbar',
                items: [{
                    iconCls: 'feed-add',
                    text: 'Add Feed',
                    action: 'add'
                }, {
                    iconCls: 'feed-remove',
                    text: 'Remove Feed',
                    disabled: true,
                    action: 'remove'
                }]
            }]
        });

        this.callParent(arguments);
    },

    onSelectionChange: function(selmodel, selection) {
        var selected = selection[0],
            button = this.down('button[action=remove]');
        if (selected) {
            button.enable();
        }
        else {
            button.disable();
        }
    }
});

Ext.define('FV.view.Viewport', {
    extend:  Ext.container.Viewport ,

               
                         
                            
                                     
      

    layout: 'border',

    items: [{
        region: 'center',
        xtype: 'viewer'
    }, {
        region: 'west',
        width: 225,
        xtype: 'feedlist'
    }]
});

Ext.define('FV.model.Article', {
    extend:  Ext.data.Model ,
    
    fields: [
        'title', 'author', {
            name: 'pubDate',
            type: 'date'
        }, 'link', 'description', 'content'
    ]
});

Ext.define('FV.store.Articles', {
    extend:  Ext.data.Store ,

                                      

    model: 'FV.model.Article',

    proxy: {
        type: 'ajax',
        url: 'feed-proxy.php',
        reader: {
            type: 'xml',
            record: 'item'
        }
    },

    sortInfo: {
        property: 'pubDate',
        direction: 'DESC'
    }
});

Ext.define('FV.controller.Articles', {
    extend:  Ext.app.Controller ,

    stores: ['Articles'],

    models: ['Article'],

    views: ['article.Grid', 'article.Preview'],

    refs: [{
        ref: 'feedShow',
        selector: 'feedshow'
    }, {
    	ref: 'viewer',
    	selector: 'viewer'
    }, {
    	ref: 'articlePreview',
    	selector: 'articlepreview'
    }, {
        ref: 'articleTab',
        xtype: 'articlepreview',
        closable: true,
        forceCreate: true,
        selector: 'articlepreview'
    }],

    init: function() {
        this.control({
            'articlegrid': {
                selectionchange: this.previewArticle
            },
            'articlegrid > tableview': {
                itemdblclick: this.loadArticle,
                refresh: this.selectArticle
            },
            'articlegrid button[action=openall]': {
                click: this.openAllArticles
            },
            'articlepreview button[action=viewintab]': {
                click: this.viewArticle
            },
            'articlepreview button[action=gotopost]': {
                click: this.openArticle
            }
        });
    },

    selectArticle: function(view) {
        var first = this.getArticlesStore().getAt(0);
        if (first) {
            view.getSelectionModel().select(first);
        }
    },

    /**
     * Loads the given article into the preview panel
     * @param {FV.model.Article} article The article to load
     */
    previewArticle: function(grid, articles) {
        var article = articles[0],
            articlePreview = this.getArticlePreview();

        if (article) {
            articlePreview.article = article;
    		articlePreview.update(article.data);
        }
    },

    openArticle: function(btn) {
        window.open(btn.up('articlepreview').article.get('link'));
    },
    
    openAllArticles: function() {
        this.loadArticles(this.getArticlesStore().getRange());
    },

    viewArticle: function(btn) {
        this.loadArticle(null, btn.up('articlepreview').article);
    },
    
    loadArticles: function(articles){
        var viewer = this.getViewer(),
            toAdd = [],
            id;
            
        Ext.Array.forEach(articles, function(article){
            id = article.id;
            if (!viewer.down('[articleId=' + id + ']')) {
                tab = this.getArticleTab();
                tab.down('button[action=viewintab]').destroy();
                tab.setTitle(article.get('title'));
                tab.article = article;
                tab.articleId = id;
                tab.update(article.data);
                toAdd.push(tab);
            }
        }, this);
        viewer.add(toAdd);
    },

    /**
     * Loads the given article into a new tab
     * @param {FV.model.Article} article The article to load into a new tab
     */
    loadArticle: function(view, article) {
        var viewer = this.getViewer(),
            title = article.get('title'),
            articleId = article.id;
            
        tab = viewer.down('[articleId=' + articleId + ']');
        if (!tab) {
            tab = this.getArticleTab();
            tab.down('button[action=viewintab]').destroy();
        }

        tab.setTitle(title);
        tab.article = article;
        tab.articleId = articleId;
        tab.update(article.data);

        viewer.add(tab);
        viewer.setActiveTab(tab);            
        
        return tab;
    }
});

Ext.define('FV.lib.FeedValidator', {
    singleton: true,
    
    /**
     * @cfg {String} url The url to validate feeds on
     */
    url: 'feed-proxy.php',
    
    /**
     * Validates a given feed's formating by fetching it and ensuring it is well formed
     * @param {FV.model.Feed} feed The feed to validate
     */
    validate: function(feed, options) {
        options = options || {};
        
        Ext.applyIf(options, {
            scope: this,
            success: Ext.emptyFn,
            failure: Ext.emptyFn
        });
        
        Ext.Ajax.request({
            url: this.url,
            params: {
                feed: feed.get('url')
            },
            scope: this,
            success: function(response) {
                if (this.checkResponse(response, feed)) {
                    options.success.call(options.scope, feed);
                }
            },
            failure: function() {
                options.failure.call(options.scope);
            }
        });
    },
    
    /**
     * @private
     * Validates that a response contains a well-formed feed
     * @param {Object} response The response object
     */
    checkResponse: function(response, feed) {
        var dq  = Ext.DomQuery,
            url = feed.get('url'),
            xml, channel, title;

        try {
            xml = response.responseXML;
            channel = xml.getElementsByTagName('channel')[0];
            
            if (channel) {
                title = dq.selectValue('title', channel, url);
                return true;
            }
        } catch(e) {
        }
        return false;
    }
});

Ext.define('FV.model.Feed', {
    extend:  Ext.data.Model ,
    
    proxy: {
        type: 'memory'
    },
    
    fields: [
        {name: 'url',  type: 'string'},
        {name: 'name', type: 'string'}
    ]
});

Ext.define('FV.store.Feeds', {
    extend:  Ext.data.Store ,

    model: 'FV.model.Feed',

    data: [
        {name: 'Sencha Blog',   url: 'http://feeds.feedburner.com/extblog'},
        {name: 'Sencha Forums', url: 'http://sencha.com/forum/external.php?type=RSS2'},
        {name: 'Ajaxian',       url: 'http://feeds.feedburner.com/ajaxian'}
    ]
});

Ext.define('FV.view.feed.Add', {
    extend:  Ext.window.Window ,

    alias: 'widget.feedwindow',

                                                            

    defaultFeeds: [
        ['http://rss.cnn.com/rss/edition.rss', 'CNN Top Stories'],
        ['http://sports.espn.go.com/espn/rss/news', 'ESPN Top News'],
        ['http://news.google.com/news?ned=us&topic=t&output=rss', 'Sci/Tech - Google News'],
        ['http://rss.news.yahoo.com/rss/software', 'Yahoo Software News']
    ],
    
    defaultFocus: '#feed',

    width: 500,
    title: 'Add Feed',
    iconCls: 'feed-add',
    layout: 'fit',
    modal: true,
    plain: true,

    initComponent: function() {
        Ext.apply(this, {
            buttons: [{
                text: 'Add feed',
                action: 'create'
            }, {
                text: 'Cancel',
                scope: this,
                handler: this.close
            }],

            items: [{
                xtype: 'form',
                bodyPadding: '12 10 10',
                border: false,
                unstyled: true,
                items: [{
                    itemId: 'feed',
                    anchor: '0',
                    fieldLabel: 'Enter the URL of the feed to add',
                    labelAlign: 'top',
                    msgTarget: 'under',
                    xtype: 'combo',
                    store: this.defaultFeeds,
                    getInnerTpl: function() {
                        return '<div class="feed-picker-url">{field1}</div><div class="feed-picker-title">{field2}</div>';
                    }
                }]
            }]
        });

        this.callParent(arguments);
    }
});

Ext.define('FV.controller.Feeds', {
    extend:  Ext.app.Controller ,

    stores: ['Feeds', 'Articles'],
    models: ['Feed'],
    views: ['feed.Add'],
    
    refs: [
        {ref: 'feedList', selector: 'feedlist'},
        {ref: 'feedData', selector: 'feedlist dataview'},
        {ref: 'feedShow', selector: 'feedshow'},
        {ref: 'feedForm', selector: 'feedwindow form'},
        {ref: 'feedCombo', selector: 'feedwindow combobox'},
        {ref: 'articleGrid', selector: 'articlegrid'},
        {
            ref: 'feedWindow', 
            selector: 'feedwindow', 
            autoCreate: true,
            xtype: 'feedwindow'
        }
    ],
    
               
                               
                            
                        
      

    // At this point things haven't rendered yet since init gets called on controllers before the launch function
    // is executed on the Application
    init: function() {
        this.control({
            'feedlist dataview': {
                selectionchange: this.loadFeed
            },
            'feedlist button[action=add]': {
                click: this.addFeed
            },
            'feedlist button[action=remove]': {
                click: this.removeFeed
            },
            'feedwindow button[action=create]': {
                click: this.createFeed
            }
        });
    },
    
    onLaunch: function() {
        var dataview = this.getFeedData(),
            store = this.getFeedsStore();
            
        dataview.bindStore(store);
        dataview.getSelectionModel().select(store.getAt(0));
    },
    
    /**
     * Loads the given feed into the viewer
     * @param {FV.model.feed} feed The feed to load
     */
    loadFeed: function(selModel, selected) {
        var grid = this.getArticleGrid(),
            store = this.getArticlesStore(),
            feed = selected[0];

        if (feed) {
            this.getFeedShow().setTitle(feed.get('name'));
            grid.enable();
            store.load({
                params: {
                    feed: feed.get('url')
                }
            });            
        }
    },
    
    /**
     * Shows the add feed dialog window
     */
    addFeed: function() {
        this.getFeedWindow().show();
    },
    
    /**
     * Removes the given feed from the Feeds store
     * @param {FV.model.Feed} feed The feed to remove
     */
    removeFeed: function() {
        this.getFeedsStore().remove(this.getFeedData().getSelectionModel().getSelection()[0]);
    },
    
    /**
     * @private
     * Creates a new feed in the store based on a given url. First validates that the feed is well formed
     * using FV.lib.FeedValidator.
     * @param {String} name The name of the Feed to create
     * @param {String} url The url of the Feed to create
     */
    createFeed: function() {
        var win   = this.getFeedWindow(),
            form  = this.getFeedForm(),
            combo = this.getFeedCombo(),
            store = this.getFeedsStore(),
            feed  = this.getFeedModel().create({
                name: combo.getDisplayValue(),
                url: combo.getValue()
            });

        form.setLoading({
            msg: 'Validating feed...'
        });
        
        FV.lib.FeedValidator.validate(feed, {
            success: function() {
                store.add(feed);
                form.setLoading(false);
                win.close();
            },
            failure: function() {
                form.setLoading(false);
                form.down('[name=feed]').markInvalid('The URL specified is not a valid RSS2 feed.');
            }
        });
    }
});

Ext.application({
    name: 'FV',

    // All the paths for custom classes
    paths: {
        'Ext.ux': '../../../examples/ux/'
    },

    // Define all the controllers that should initialize at boot up of your application
    controllers: [
        'Articles',
        'Feeds'
    ],
    
    autoCreateViewport: true
});

//@tag page-feed-viewer
//@require ../../examples/app/feed-viewer/all-classes.js
//@require ../../examples/app/feed-viewer/app.js

