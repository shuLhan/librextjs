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
 * Component layout for editors
 * @private
 */
Ext.define('Ext.layout.container.Editor', {

    /* Begin Definitions */

    alias: 'layout.editor',

    extend:  Ext.layout.container.Container ,

    /* End Definitions */

    autoSizeDefault: {
        width: 'field',
        height: 'field'    
    },

    sizePolicies: {
        // indexed by autoSize.width
        $: {
            // indexed by autoSize.height
            $: {
                readsWidth: 1,
                readsHeight: 1,
                setsWidth: 0,
                setsHeight: 0
            },
            boundEl: {
                readsWidth: 1,
                readsHeight: 0,
                setsWidth: 0,
                setsHeight: 1
            }
        },

        boundEl: {
            // indexed by autoSize.height
            $: {
                readsWidth: 0,
                readsHeight: 1,
                setsWidth: 1,
                setsHeight: 0
            },
            boundEl: {
                readsWidth: 0,
                readsHeight: 0,
                setsWidth: 1,
                setsHeight: 1
            }
        }
    },

    getItemSizePolicy: function (item) {
        var me = this,
            autoSize = me.owner.autoSize,
            key = autoSize && autoSize.width,
            policy = me.sizePolicies;

        policy = policy[key] || policy.$;

        key = autoSize && autoSize.height;
        policy = policy[key] || policy.$;

        return policy;
    },

    calculate: function(ownerContext) {
        var me = this,
            owner = me.owner,
            autoSize = owner.autoSize,
            fieldWidth,
            fieldHeight;
            
        if (autoSize === true) {
            autoSize = me.autoSizeDefault;
        }

        // Calculate size of both Editor, and its owned Field
        if (autoSize) {
            fieldWidth  = me.getDimension(owner, autoSize.width,  'getWidth',  owner.width);
            fieldHeight = me.getDimension(owner, autoSize.height, 'getHeight', owner.height);
        }

        // Set Field size
        ownerContext.childItems[0].setSize(fieldWidth, fieldHeight);

        // Bypass validity checking. Container layouts should not usually set their owner's size.
        ownerContext.setWidth(fieldWidth);
        ownerContext.setHeight(fieldHeight);

        // This is a Container layout, so publish content size
        ownerContext.setContentSize(fieldWidth || owner.field.getWidth(),
                                    fieldHeight || owner.field.getHeight());
    },

    getDimension: function(owner, type, getMethod, ownerSize){
        switch (type) {
            // Size to boundEl's dimension
            case 'boundEl':
                return owner.boundEl[getMethod]();

            // Auto size (shrink wrap the Field's size
            case 'field':
                return undefined;

            // Size to the Editor's configured size
            default:
                return ownerSize;
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
 * @class Ext.chart.Callout
 * A mixin providing callout functionality for Ext.chart.series.Series.
 */
Ext.define('Ext.chart.Callout', {

    /* Begin Definitions */

    /* End Definitions */

    constructor: function(config) {
        if (config.callouts) {
            config.callouts.styles = Ext.applyIf(config.callouts.styles || {}, {
                color: "#000",
                font: "11px Helvetica, sans-serif"
            });
            this.callouts = Ext.apply(this.callouts || {}, config.callouts);
            this.calloutsArray = [];
        }
    },

    renderCallouts: function() {
        if (!this.callouts) {
            return;
        }

        var me = this,
            items = me.items,
            animate = me.chart.animate,
            config = me.callouts,
            styles = config.styles,
            group = me.calloutsArray,
            store = me.chart.getChartStore(),
            len = store.getCount(),
            ratio = items.length / len,
            previouslyPlacedCallouts = [],
            i,
            count,
            j,
            p,
            item,
            label,
            storeItem,
            display;
            
        for (i = 0, count = 0; i < len; i++) {
            for (j = 0; j < ratio; j++) {
                item = items[count];
                label = group[count];
                storeItem = store.getAt(i);
                
                display = (!config.filter || config.filter(storeItem));
                
                if (!display && !label) {
                    count++;
                    continue;               
                }
                
                if (!label) {
                    group[count] = label = me.onCreateCallout(storeItem, item, i, display, j, count);
                }
                for (p in label) {
                    if (label[p] && label[p].setAttributes) {
                        label[p].setAttributes(styles, true);
                    }
                }
                if (!display) {
                    for (p in label) {
                        if (label[p]) {
                            if (label[p].setAttributes) {
                                label[p].setAttributes({
                                    hidden: true
                                }, true);
                            } else if(label[p].setVisible) {
                                label[p].setVisible(false);
                            }
                        }
                    }
                }
                if (config && config.renderer) {
                    config.renderer(label, storeItem);
                }
                me.onPlaceCallout(label, storeItem, item, i, display, animate,
                                  j, count, previouslyPlacedCallouts);
                previouslyPlacedCallouts.push(label);
                count++;
            }
        }
        this.hideCallouts(count);
    },

    onCreateCallout: function(storeItem, item, i, display) {
        var me = this,
            group = me.calloutsGroup,
            config = me.callouts,
            styles = (config ? config.styles : undefined),
            width = (styles ? styles.width : 0),
            height = (styles ? styles.height : 0),
            chart = me.chart,
            surface = chart.surface,
            calloutObj = {
                //label: false,
                //box: false,
                lines: false
            };

        calloutObj.lines = surface.add(Ext.apply({},
        {
            type: 'path',
            path: 'M0,0',
            stroke: me.getLegendColor() || '#555'
        },
        styles));

        if (config.items) {
            calloutObj.panel = new Ext.Panel({
                style: "position: absolute;",    
                width: width,
                height: height,
                items: config.items,
                renderTo: chart.el
            });
        }

        return calloutObj;
    },

    hideCallouts: function(index) {
        var calloutsArray = this.calloutsArray,
            len = calloutsArray.length,
            co,
            p;
        while (len-->index) {
            co = calloutsArray[len];
            for (p in co) {
                if (co[p]) {
                    co[p].hide(true);
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
 * A composite Sprite handles a group of sprites with common methods to a sprite
 * such as `hide`, `show`, `setAttributes`. These methods are applied to the set of sprites
 * added to the group.
 *
 * CompositeSprite extends {@link Ext.util.MixedCollection} so you can use the same methods
 * in `MixedCollection` to iterate through sprites, add and remove elements, etc.
 *
 * In order to create a CompositeSprite, one has to provide a handle to the surface where it is
 * rendered:
 *
 *     var group = Ext.create('Ext.draw.CompositeSprite', {
 *         surface: drawComponent.surface
 *     });
 *                  
 * Then just by using `MixedCollection` methods it's possible to add {@link Ext.draw.Sprite}s:
 *  
 *     group.add(sprite1);
 *     group.add(sprite2);
 *     group.add(sprite3);
 *                  
 * And then apply common Sprite methods to them:
 *  
 *     group.setAttributes({
 *         fill: '#f00'
 *     }, true);
 */
Ext.define('Ext.draw.CompositeSprite', {

    /* Begin Definitions */

    extend:  Ext.util.MixedCollection ,
    mixins: {
        animate:  Ext.util.Animate 
    },
    autoDestroy: false,
    
    /* End Definitions */
    isCompositeSprite: true,
    constructor: function(config) {
        var me = this;
        
        config = config || {};
        Ext.apply(me, config);

        me.addEvents(
            /**
             * @event
             * @inheritdoc Ext.draw.Sprite#mousedown
             */
            'mousedown',
            /**
             * @event
             * @inheritdoc Ext.draw.Sprite#mouseup
             */
            'mouseup',
            /**
             * @event
             * @inheritdoc Ext.draw.Sprite#mouseover
             */
            'mouseover',
            /**
             * @event
             * @inheritdoc Ext.draw.Sprite#mouseout
             */
            'mouseout',
            /**
             * @event
             * @inheritdoc Ext.draw.Sprite#click
             */
            'click'
        );
        me.id = Ext.id(null, 'ext-sprite-group-');
        me.callParent();
    },

    // @private
    onClick: function(e) {
        this.fireEvent('click', e);
    },

    // @private
    onMouseUp: function(e) {
        this.fireEvent('mouseup', e);
    },

    // @private
    onMouseDown: function(e) {
        this.fireEvent('mousedown', e);
    },

    // @private
    onMouseOver: function(e) {
        this.fireEvent('mouseover', e);
    },

    // @private
    onMouseOut: function(e) {
        this.fireEvent('mouseout', e);
    },

    attachEvents: function(o) {
        var me = this;
        
        o.on({
            scope: me,
            mousedown: me.onMouseDown,
            mouseup: me.onMouseUp,
            mouseover: me.onMouseOver,
            mouseout: me.onMouseOut,
            click: me.onClick
        });
    },

    // Inherit docs from MixedCollection
    add: function(key, o) {
        var result = this.callParent(arguments);
        this.attachEvents(result);
        return result;
    },

    insert: function(index, key, o) {
        return this.callParent(arguments);
    },

    // Inherit docs from MixedCollection
    remove: function(o) {
        var me = this;
        
        o.un({
            scope: me,
            mousedown: me.onMouseDown,
            mouseup: me.onMouseUp,
            mouseover: me.onMouseOver,
            mouseout: me.onMouseOut,
            click: me.onClick
        });
        return me.callParent(arguments);
    },
    
    /**
     * Returns the group bounding box.
     * Behaves like {@link Ext.draw.Sprite#getBBox} method.
     * @return {Object} an object with x, y, width, and height properties.
     */
    getBBox: function() {
        var i = 0,
            sprite,
            bb,
            items = this.items,
            len = this.length,
            infinity = Infinity,
            minX = infinity,
            maxHeight = -infinity,
            minY = infinity,
            maxWidth = -infinity,
            maxWidthBBox, maxHeightBBox;
        
        for (; i < len; i++) {
            sprite = items[i];
            if (sprite.el && ! sprite.bboxExcluded) {
                bb = sprite.getBBox();
                minX = Math.min(minX, bb.x);
                minY = Math.min(minY, bb.y);
                maxHeight = Math.max(maxHeight, bb.height + bb.y);
                maxWidth = Math.max(maxWidth, bb.width + bb.x);
            }
        }
        
        return {
            x: minX,
            y: minY,
            height: maxHeight - minY,
            width: maxWidth - minX
        };
    },

    /**
     * Iterates through all sprites calling `setAttributes` on each one. For more information {@link Ext.draw.Sprite}
     * provides a description of the attributes that can be set with this method.
     * @param {Object} attrs Attributes to be changed on the sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.CompositeSprite} this
     */
    setAttributes: function(attrs, redraw) {
        var i = 0,
            items = this.items,
            len = this.length;
            
        for (; i < len; i++) {
            items[i].setAttributes(attrs, redraw);
        }
        return this;
    },

    /**
     * Hides all sprites. If `true` is passed then a redraw will be forced for each sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.CompositeSprite} this
     */
    hide: function(redraw) {
        var i = 0,
            items = this.items,
            len = this.length;
            
        for (; i < len; i++) {
            items[i].hide(redraw);
        }
        return this;
    },

    /**
     * Shows all sprites. If `true` is passed then a redraw will be forced for each sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.CompositeSprite} this
     */
    show: function(redraw) {
        var i = 0,
            items = this.items,
            len = this.length;
            
        for (; i < len; i++) {
            items[i].show(redraw);
        }
        return this;
    },

    /**
     * Force redraw of all sprites.
     */
    redraw: function() {
        var me = this,
            i = 0,
            items = me.items,
            surface = me.getSurface(),
            len = me.length;
        
        if (surface) {
            for (; i < len; i++) {
                surface.renderItem(items[i]);
            }
        }
        return me;
    },

    /**
     * Sets style for all sprites.
     * @param {String} style CSS Style definition.
     */
    setStyle: function(obj) {
        var i = 0,
            items = this.items,
            len = this.length,
            item, el;
            
        for (; i < len; i++) {
            item = items[i];
            el = item.el;
            if (el) {
                el.setStyle(obj);
            }
        }
    },

    /**
     * Adds class to all sprites.
     * @param {String} cls CSS class name
     */
    addCls: function(obj) {
        var i = 0,
            items = this.items,
            surface = this.getSurface(),
            len = this.length;
        
        if (surface) {
            for (; i < len; i++) {
                surface.addCls(items[i], obj);
            }
        }
    },

    /**
     * Removes class from all sprites.
     * @param {String} cls CSS class name
     */
    removeCls: function(obj) {
        var i = 0,
            items = this.items,
            surface = this.getSurface(),
            len = this.length;
        
        if (surface) {
            for (; i < len; i++) {
                surface.removeCls(items[i], obj);
            }
        }
    },
    
    /**
     * Grab the surface from the items
     * @private
     * @return {Ext.draw.Surface} The surface, null if not found
     */
    getSurface: function(){
        var first = this.first();
        if (first) {
            return first.surface;
        }
        return null;
    },
    
    /**
     * Destroys this CompositeSprite.
     */
    destroy: function(){
        var me = this,
            surface = me.getSurface(),
            destroySprites = me.autoDestroy,
            item;
            
        if (surface) {
            while (me.getCount() > 0) {
                item = me.first();
                me.remove(item);
                surface.remove(item, destroySprites);
            }
        }
        me.clearListeners();
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
 * A Surface is an interface to render methods inside {@link Ext.draw.Component}.
 *
 * Most of the Surface methods are abstract and they have a concrete implementation
 * in {@link Ext.draw.engine.Vml VML} or {@link Ext.draw.engine.Svg SVG} engines.
 *
 * A Surface contains methods to render {@link Ext.draw.Sprite sprites}, get bounding
 * boxes of sprites, add sprites to the canvas, initialize other graphic components, etc.
 *
 * ## Adding sprites to surface
 *
 * One of the most used methods for this class is the {@link #add} method, to add Sprites to
 * the surface. For example:
 *
 *     drawComponent.surface.add({
 *         type: 'circle',
 *         fill: '#ffc',
 *         radius: 100,
 *         x: 100,
 *         y: 100
 *     });
 *
 * The configuration object passed in the `add` method is the same as described in the
 * {@link Ext.draw.Sprite} class documentation.
 *
 * Sprites can also be added to surface by setting their surface config at creation time:
 *
 *     var sprite = Ext.create('Ext.draw.Sprite', {
 *         type: 'circle',
 *         fill: '#ff0',
 *         surface: drawComponent.surface,
 *         radius: 5
 *     });
 *
 * In order to properly apply properties and render the sprite we have to
 * `show` the sprite setting the option `redraw` to `true`:
 *
 *     sprite.show(true);
 *
 */
Ext.define('Ext.draw.Surface', {

    /* Begin Definitions */

    mixins: {
        observable:  Ext.util.Observable 
    },

                                           
                                                                                                                         

    separatorRe: /[, ]+/,
    
    enginePriority: ['Svg', 'Vml'],

    statics: {
        /**
         * Creates and returns a new concrete Surface instance appropriate for the current environment.
         * @param {Object} config Initial configuration for the Surface instance
         * @param {String[]} enginePriority (Optional) order of implementations to use; the first one that is
         * available in the current environment will be used. Defaults to `['Svg', 'Vml']`.
         * @return {Object} The created Surface or false.
         * @static
         */
        create: function(config, enginePriority) {
            enginePriority = enginePriority || this.prototype.enginePriority;

            var i = 0,
                len = enginePriority.length;

            for (; i < len; i++) {
                if (Ext.supports[enginePriority[i]]) {
                    return Ext.create('Ext.draw.engine.' + enginePriority[i], config);
                }
            }
            return false;
        },
        
        /**
         * Exports a {@link Ext.draw.Surface surface} in a different format.
         * The surface may be exported to an SVG string, using the
         * {@link Ext.draw.engine.SvgExporter}. It may also be exported
         * as an image using the {@link Ext.draw.engine.ImageExporter ImageExporter}.
         * Note that this requires sending data to a remote server to process
         * the SVG into an image, see the {@link Ext.draw.engine.ImageExporter} for
         * more details.
         * @param {Ext.draw.Surface} surface The surface to export.
         * @param {Object} [config] The configuration to be passed to the exporter.
         * See the export method for the appropriate exporter for the relevant
         * configuration options
         * @return {Object} See the return types for the appropriate exporter
         * @static
         */
        save: function(surface, config) {
            config = config || {};
            var exportTypes = {
                    'image/png': 'Image',
                    'image/jpeg': 'Image',
                    'image/svg+xml': 'Svg'
                },
                prefix = exportTypes[config.type] || 'Svg',
                exporter = Ext.draw.engine[prefix + 'Exporter'];           

            return exporter.generate(surface, config);
            
        }
    },

    /* End Definitions */

    // @private
    availableAttrs: {
        blur: 0,
        "clip-rect": "0 0 1e9 1e9",
        cursor: "default",
        cx: 0,
        cy: 0,
        'dominant-baseline': 'auto',
        fill: "none",
        "fill-opacity": 1,
        font: '10px "Arial"',
        "font-family": '"Arial"',
        "font-size": "10",
        "font-style": "normal",
        "font-weight": 400,
        gradient: "",
        height: 0,
        hidden: false,
        href: "http://sencha.com/",
        opacity: 1,
        path: "M0,0",
        radius: 0,
        rx: 0,
        ry: 0,
        scale: "1 1",
        src: "",
        stroke: "none",
        "stroke-dasharray": "",
        "stroke-linecap": "butt",
        "stroke-linejoin": "butt",
        "stroke-miterlimit": 0,
        "stroke-opacity": 1,
        "stroke-width": 1,
        target: "_blank",
        text: "",
        "text-anchor": "middle",
        title: "Ext Draw",
        width: 0,
        x: 0,
        y: 0,
        zIndex: 0
    },

    /**
     * @cfg {Number} height
     * The height of this component in pixels (defaults to auto).
     */
    /**
     * @cfg {Number} width
     * The width of this component in pixels (defaults to auto).
     */

    container: undefined,
    height: 352,
    width: 512,
    x: 0,
    y: 0,

    /**
     * @cfg {Ext.draw.Sprite[]} items
     * Array of sprites or sprite config objects to add initially to the surface.
     */

    /**
     * @private Flag indicating that the surface implementation requires sprites to be maintained
     * in order of their zIndex. Impls that don't require this can set it to false.
     */
    orderSpritesByZIndex: true,


    /**
     * Creates new Surface.
     * @param {Object} config (optional) Config object.
     */
    constructor: function(config) {
        var me = this;
        config = config || {};
        Ext.apply(me, config);

        me.domRef = Ext.getDoc().dom;

        me.customAttributes = {};

        me.addEvents(
            /**
             * @event
             * Fires when a mousedown is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mousedown',
            /**
             * @event
             * Fires when a mouseup is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mouseup',
            /**
             * @event
             * Fires when a mouseover is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mouseover',
            /**
             * @event
             * Fires when a mouseout is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mouseout',
            /**
             * @event
             * Fires when a mousemove is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mousemove',
            /**
             * @event
             * Fires when a mouseenter is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mouseenter',
            /**
             * @event
             * Fires when a mouseleave is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'mouseleave',
            /**
             * @event
             * Fires when a click is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'click',
            /**
             * @event
             * Fires when a dblclick is detected within the surface.
             * @param {Ext.EventObject} e An object encapsulating the DOM event.
             */
            'dblclick'
        );

        me.mixins.observable.constructor.call(me);

        me.getId();
        me.initGradients();
        me.initItems();
        if (me.renderTo) {
            me.render(me.renderTo);
            delete me.renderTo;
        }
        me.initBackground(config.background);
    },

    // @private called to initialize components in the surface
    // this is dependent on the underlying implementation.
    initSurface: Ext.emptyFn,

    // @private called to setup the surface to render an item
    //this is dependent on the underlying implementation.
    renderItem: Ext.emptyFn,

    // @private
    renderItems: Ext.emptyFn,

    // @private
    setViewBox: function (x, y, width, height) {
        if (isFinite(x) && isFinite(y) && isFinite(width) && isFinite(height)) {
            this.viewBox = {x: x, y: y, width: width, height: height};
            this.applyViewBox();
        }
    },

    /**
     * Adds one or more CSS classes to the element. Duplicate classes are automatically filtered out.
     *
     * For example:
     *
     *     drawComponent.surface.addCls(sprite, 'x-visible');
     *
     * @param {Object} sprite The sprite to add the class to.
     * @param {String/String[]} className The CSS class to add, or an array of classes
     * @method
     */
    addCls: Ext.emptyFn,

    /**
     * Removes one or more CSS classes from the element.
     *
     * For example:
     *
     *     drawComponent.surface.removeCls(sprite, 'x-visible');
     *
     * @param {Object} sprite The sprite to remove the class from.
     * @param {String/String[]} className The CSS class to remove, or an array of classes
     * @method
     */
    removeCls: Ext.emptyFn,

    /**
     * Sets CSS style attributes to an element.
     *
     * For example:
     *
     *     drawComponent.surface.setStyle(sprite, {
     *         'cursor': 'pointer'
     *     });
     *
     * @param {Object} sprite The sprite to add, or an array of classes to
     * @param {Object} styles An Object with CSS styles.
     * @method
     */
    setStyle: Ext.emptyFn,

    // @private
    initGradients: function() {
        if (this.hasOwnProperty('gradients')) {
            var gradients = this.gradients,
                fn = this.addGradient,
                g, gLen;

            if (gradients) {
                for (g = 0, gLen = gradients.length; g < gLen; g++) {
                    if (fn.call(this, gradients[g], g, gLen) === false) {
                        break;
                    }
                }
            }
        }
    },

    // @private
    initItems: function() {
        var items = this.items;
        this.items = new Ext.draw.CompositeSprite();
        this.items.autoDestroy = true;
        this.groups = new Ext.draw.CompositeSprite();
        if (items) {
            this.add(items);
        }
    },

    // @private
    initBackground: function(config) {
        var me = this,
            width = me.width,
            height = me.height,
            gradientId, gradient;
        if (Ext.isString(config)) {
            config = {
                fill : config
            };
        }
        if (config) {
            if (config.gradient) {
                gradient = config.gradient;
                gradientId = gradient.id;
                me.addGradient(gradient);
                me.background = me.add({
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    fill: 'url(#' + gradientId + ')',
                    zIndex: -1
                });
            } else if (config.fill) {
                me.background = me.add({
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    fill: config.fill,
                    zIndex: -1
                });
            } else if (config.image) {
                me.background = me.add({
                    type: 'image',
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    src: config.image,
                    zIndex: -1
                });
            }
            // prevent me.background to jeopardize me.items.getBBox
            me.background.bboxExcluded = true;
        }
    },

    /**
     * Sets the size of the surface. Accomodates the background (if any) to fit the new size too.
     *
     * For example:
     *
     *     drawComponent.surface.setSize(500, 500);
     *
     * This method is generally called when also setting the size of the draw Component.
     *
     * @param {Number} w The new width of the canvas.
     * @param {Number} h The new height of the canvas.
     */
    setSize: function(w, h) {
        this.applyViewBox();
    },

    // @private
    scrubAttrs: function(sprite) {
        var i,
            attrs = {},
            exclude = {},
            sattr = sprite.attr;
        for (i in sattr) {
            // Narrow down attributes to the main set
            if (this.translateAttrs.hasOwnProperty(i)) {
                // Translated attr
                attrs[this.translateAttrs[i]] = sattr[i];
                exclude[this.translateAttrs[i]] = true;
            }
            else if (this.availableAttrs.hasOwnProperty(i) && !exclude[i]) {
                // Passtrhough attr
                attrs[i] = sattr[i];
            }
        }
        return attrs;
    },

    // @private
    onClick: function(e) {
        this.processEvent('click', e);
    },
    
    // @private
    onDblClick: function(e) {
        this.processEvent('dblclick', e);
    },

    // @private
    onMouseUp: function(e) {
        this.processEvent('mouseup', e);
    },

    // @private
    onMouseDown: function(e) {
        this.processEvent('mousedown', e);
    },

    // @private
    onMouseOver: function(e) {
        this.processEvent('mouseover', e);
    },

    // @private
    onMouseOut: function(e) {
        this.processEvent('mouseout', e);
    },

    // @private
    onMouseMove: function(e) {
        this.fireEvent('mousemove', e);
    },

    // @private
    onMouseEnter: Ext.emptyFn,

    // @private
    onMouseLeave: Ext.emptyFn,

    /**
     * Adds a gradient definition to the Surface. Note that in some surface engines, adding
     * a gradient via this method will not take effect if the surface has already been rendered.
     * Therefore, it is preferred to pass the gradients as an item to the surface config, rather
     * than calling this method, especially if the surface is rendered immediately (e.g. due to
     * 'renderTo' in its config). For more information on how to create gradients in the Chart
     * configuration object please refer to {@link Ext.chart.Chart}.
     *
     * The gradient object to be passed into this method is composed by:
     *
     * - **id** - string - The unique name of the gradient.
     * - **angle** - number, optional - The angle of the gradient in degrees.
     * - **stops** - object - An object with numbers as keys (from 0 to 100) and style objects as values.
     *
     * For example:
     *
     *    drawComponent.surface.addGradient({
     *        id: 'gradientId',
     *        angle: 45,
     *        stops: {
     *            0: {
     *                color: '#555'
     *            },
     *            100: {
     *                color: '#ddd'
     *            }
     *        }
     *    });
     *
     * @param {Object} gradient A gradient config.
     * @method
     */
    addGradient: Ext.emptyFn,

    /**
     * Adds a Sprite to the surface. See {@link Ext.draw.Sprite} for the configuration object to be
     * passed into this method.
     *
     * For example:
     *
     *     drawComponent.surface.add({
     *         type: 'circle',
     *         fill: '#ffc',
     *         radius: 100,
     *         x: 100,
     *         y: 100
     *     });
     *
     * @param {Ext.draw.Sprite[]/Ext.draw.Sprite...} args One or more Sprite objects or configs.
     * @return {Ext.draw.Sprite[]/Ext.draw.Sprite} The sprites added.
     */
    add: function() {
        var args = Array.prototype.slice.call(arguments),
            sprite,
            hasMultipleArgs = args.length > 1,
            items,
            results,
            i,
            ln,
            item;
            
        if (hasMultipleArgs || Ext.isArray(args[0])) {
            items = hasMultipleArgs ? args : args[0];
            results = [];

            for (i = 0, ln = items.length; i < ln; i++) {
                item = items[i];
                item = this.add(item);
                results.push(item);
            }

            return results;
        }
        sprite = this.prepareItems(args[0], true)[0];
        this.insertByZIndex(sprite);
        this.onAdd(sprite);
        return sprite;
    },

    /**
     * @private
     * Inserts a given sprite into the correct position in the items collection, according to
     * its zIndex. It will be inserted at the end of an existing series of sprites with the same or
     * lower zIndex. By ensuring sprites are always ordered, this allows surface subclasses to render
     * the sprites in the correct order for proper z-index stacking.
     * @param {Ext.draw.Sprite} sprite
     * @return {Number} the sprite's new index in the list
     */
    insertByZIndex: function(sprite) {
        var me = this,
            sprites = me.items.items,
            len = sprites.length,
            ceil = Math.ceil,
            zIndex = sprite.attr.zIndex,
            idx = len,
            high = idx - 1,
            low = 0,
            otherZIndex;

        if (me.orderSpritesByZIndex && len && zIndex < sprites[high].attr.zIndex) {
            // Find the target index via a binary search for speed
            while (low <= high) {
                idx = ceil((low + high) / 2);
                otherZIndex = sprites[idx].attr.zIndex;
                if (otherZIndex > zIndex) {
                    high = idx - 1;
                }
                else if (otherZIndex < zIndex) {
                    low = idx + 1;
                }
                else {
                    break;
                }
            }
            // Step forward to the end of a sequence of the same or lower z-index
            while (idx < len && sprites[idx].attr.zIndex <= zIndex) {
                idx++;
            }
        }

        me.items.insert(idx, sprite);
        return idx;
    },

    onAdd: function(sprite) {
        var group = sprite.group,
            draggable = sprite.draggable,
            groups, ln, i;
        if (group) {
            groups = [].concat(group);
            ln = groups.length;
            for (i = 0; i < ln; i++) {
                group = groups[i];
                this.getGroup(group).add(sprite);
            }
            delete sprite.group;
        }
        if (draggable) {
            sprite.initDraggable();
        }
    },

    /**
     * Removes a given sprite from the surface, optionally destroying the sprite in the process.
     * You can also call the sprite own `remove` method.
     *
     * For example:
     *
     *     drawComponent.surface.remove(sprite);
     *     //or...
     *     sprite.remove();
     *
     * @param {Ext.draw.Sprite} sprite
     * @param {Boolean} destroySprite
     */
    remove: function(sprite, destroySprite) {
        if (sprite) {
            this.items.remove(sprite);

            var groups = [].concat(this.groups.items),
                gLen   = groups.length,
                g;

            for (g = 0; g < gLen; g++) {
                groups[g].remove(sprite);
            }

            sprite.onRemove();
            if (destroySprite === true) {
                sprite.destroy();
            }
        }
    },

    /**
     * Removes all sprites from the surface, optionally destroying the sprites in the process.
     *
     * For example:
     *
     *     drawComponent.surface.removeAll();
     *
     * @param {Boolean} destroySprites Whether to destroy all sprites when removing them.
     */
    removeAll: function(destroySprites) {
        var items = this.items.items,
            ln = items.length,
            i;
        for (i = ln - 1; i > -1; i--) {
            this.remove(items[i], destroySprites);
        }
    },

    onRemove: Ext.emptyFn,

    onDestroy: Ext.emptyFn,

    /**
     * @private Using the current viewBox property and the surface's width and height, calculate the
     * appropriate viewBoxShift that will be applied as a persistent transform to all sprites.
     */
    applyViewBox: function() {
        var me = this,
            viewBox = me.viewBox,
            width = me.width || 1, // Avoid problems in division
            height = me.height || 1,
            viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight,
            relativeHeight, relativeWidth, size;

        if (viewBox && (width || height)) {
            viewBoxX = viewBox.x;
            viewBoxY = viewBox.y;
            viewBoxWidth = viewBox.width;
            viewBoxHeight = viewBox.height;
            relativeHeight = height / viewBoxHeight;
            relativeWidth = width / viewBoxWidth;
            size = Math.min(relativeWidth, relativeHeight);

            if (viewBoxWidth * size < width) {
                viewBoxX -= (width - viewBoxWidth * size) / 2 / size;
            }
            if (viewBoxHeight * size < height) {
                viewBoxY -= (height - viewBoxHeight * size) / 2 / size;
            }

            me.viewBoxShift = {
                dx: -viewBoxX,
                dy: -viewBoxY,
                scale: size
            };
            
            if (me.background) {
                me.background.setAttributes(Ext.apply({}, {
                    x: viewBoxX,
                    y: viewBoxY,
                    width: width / size,
                    height: height / size
                }, { hidden: false }), true);
            }
        } else {
            if (me.background && width && height) {
                me.background.setAttributes(Ext.apply({x: 0, y: 0, width: width, height: height}, { hidden: false }), true);
            }
        }
    },


    getBBox: function (sprite, isWithoutTransform) {
        var realPath = this["getPath" + sprite.type](sprite);
        if (isWithoutTransform) {
            sprite.bbox.plain = sprite.bbox.plain || Ext.draw.Draw.pathDimensions(realPath);
            return sprite.bbox.plain;
        }
        if (sprite.dirtyTransform) {
            this.applyTransformations(sprite, true);
        }
        sprite.bbox.transform = sprite.bbox.transform || Ext.draw.Draw.pathDimensions(Ext.draw.Draw.mapPath(realPath, sprite.matrix));
        return sprite.bbox.transform;
    },
    
    transformToViewBox: function (x, y) {
        if (this.viewBoxShift) {
            var me = this, shift = me.viewBoxShift;
            return [x / shift.scale - shift.dx, y / shift.scale - shift.dy];
        } else {
            return [x, y];
        }
    },

    // @private
    applyTransformations: function(sprite, onlyMatrix) {
        if (sprite.type == 'text') {
            // TODO: getTextBBox function always take matrix into account no matter whether `isWithoutTransform` is true. Fix that.
            sprite.bbox.transform = 0;
            this.transform(sprite, false);
        }


        sprite.dirtyTransform = false;
        
        var me = this,
            attr = sprite.attr;

        if (attr.translation.x != null || attr.translation.y != null) {
            me.translate(sprite);
        }
        if (attr.scaling.x != null || attr.scaling.y != null) {
            me.scale(sprite);
        }
        if (attr.rotation.degrees != null) {
            me.rotate(sprite);
        }
        
        sprite.bbox.transform = 0;
        this.transform(sprite, onlyMatrix);
        sprite.transformations = [];
    },

    // @private
    rotate: function (sprite) {
        var bbox,
            deg = sprite.attr.rotation.degrees,
            centerX = sprite.attr.rotation.x,
            centerY = sprite.attr.rotation.y;
        if (!Ext.isNumber(centerX) || !Ext.isNumber(centerY)) {
            bbox = this.getBBox(sprite, true);
            centerX = !Ext.isNumber(centerX) ? bbox.x + bbox.width / 2 : centerX;
            centerY = !Ext.isNumber(centerY) ? bbox.y + bbox.height / 2 : centerY;
        }
        sprite.transformations.push({
            type: "rotate",
            degrees: deg,
            x: centerX,
            y: centerY
        });
    },

    // @private
    translate: function(sprite) {
        var x = sprite.attr.translation.x || 0,
            y = sprite.attr.translation.y || 0;
        sprite.transformations.push({
            type: "translate",
            x: x,
            y: y
        });
    },

    // @private
    scale: function(sprite) {
        var bbox,
            x = sprite.attr.scaling.x || 1,
            y = sprite.attr.scaling.y || 1,
            centerX = sprite.attr.scaling.centerX,
            centerY = sprite.attr.scaling.centerY;

        if (!Ext.isNumber(centerX) || !Ext.isNumber(centerY)) {
            bbox = this.getBBox(sprite, true);
            centerX = !Ext.isNumber(centerX) ? bbox.x + bbox.width / 2 : centerX;
            centerY = !Ext.isNumber(centerY) ? bbox.y + bbox.height / 2 : centerY;
        }
        sprite.transformations.push({
            type: "scale",
            x: x,
            y: y,
            centerX: centerX,
            centerY: centerY
        });
    },

    // @private
    rectPath: function (x, y, w, h, r) {
        if (r) {
            return [["M", x + r, y], ["l", w - r * 2, 0], ["a", r, r, 0, 0, 1, r, r], ["l", 0, h - r * 2], ["a", r, r, 0, 0, 1, -r, r], ["l", r * 2 - w, 0], ["a", r, r, 0, 0, 1, -r, -r], ["l", 0, r * 2 - h], ["a", r, r, 0, 0, 1, r, -r], ["z"]];
        }
        return [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
    },

    // @private
    ellipsePath: function (x, y, rx, ry) {
        if (ry == null) {
            ry = rx;
        }
        return [["M", x, y], ["m", 0, -ry], ["a", rx, ry, 0, 1, 1, 0, 2 * ry], ["a", rx, ry, 0, 1, 1, 0, -2 * ry], ["z"]];
    },

    // @private
    getPathpath: function (el) {
        return el.attr.path;
    },

    // @private
    getPathcircle: function (el) {
        var a = el.attr;
        return this.ellipsePath(a.x, a.y, a.radius, a.radius);
    },

    // @private
    getPathellipse: function (el) {
        var a = el.attr;
        return this.ellipsePath(a.x, a.y,
                                a.radiusX || (a.width / 2) || 0,
                                a.radiusY || (a.height / 2) || 0);
    },

    // @private
    getPathrect: function (el) {
        var a = el.attr;
        return this.rectPath(a.x || 0, a.y || 0, a.width || 0, a.height || 0, a.r || 0);
    },

    // @private
    getPathimage: function (el) {
        var a = el.attr;
        return this.rectPath(a.x || 0, a.y || 0, a.width, a.height);
    },

    // @private
    getPathtext: function (el) {
        var bbox = this.getBBoxText(el);
        return this.rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
    },

    createGroup: function(id) {
        var group = this.groups.get(id);
        if (!group) {
            group = new Ext.draw.CompositeSprite({
                surface: this
            });
            group.id = id || Ext.id(null, 'ext-surface-group-');
            this.groups.add(group);
        }
        return group;
    },

    /**
     * Returns a new group or an existent group associated with the current surface.
     * The group returned is a {@link Ext.draw.CompositeSprite} group.
     *
     * For example:
     *
     *     var spriteGroup = drawComponent.surface.getGroup('someGroupId');
     *
     * @param {String} id The unique identifier of the group.
     * @return {Object} The {@link Ext.draw.CompositeSprite}.
     */
    getGroup: function(id) {
        var group;
        if (typeof id == "string") {
            group = this.groups.get(id);
            if (!group) {
                group = this.createGroup(id);
            }
        } else {
            group = id;
        }
        return group;
    },

    // @private
    prepareItems: function(items, applyDefaults) {
        items = [].concat(items);
        // Make sure defaults are applied and item is initialized
        var item, i, ln;
        for (i = 0, ln = items.length; i < ln; i++) {
            item = items[i];
            if (!(item instanceof Ext.draw.Sprite)) {
                // Temporary, just take in configs...
                item.surface = this;
                items[i] = this.createItem(item);
            } else {
                item.surface = this;
            }
        }
        return items;
    },

    /**
     * Changes the text in the sprite element. The sprite must be a `text` sprite.
     * This method can also be called from {@link Ext.draw.Sprite}.
     *
     * For example:
     *
     *     var spriteGroup = drawComponent.surface.setText(sprite, 'my new text');
     *
     * @param {Object} sprite The Sprite to change the text.
     * @param {String} text The new text to be set.
     * @method
     */
    setText: Ext.emptyFn,

    // @private Creates an item and appends it to the surface. Called
    // as an internal method when calling `add`.
    createItem: Ext.emptyFn,

    /**
     * Retrieves the id of this component.
     * Will autogenerate an id if one has not already been set.
     */
    getId: function() {
        return this.id || (this.id = Ext.id(null, 'ext-surface-'));
    },

    /**
     * Destroys the surface. This is done by removing all components from it and
     * also removing its reference to a DOM element.
     *
     * For example:
     *
     *      drawComponent.surface.destroy();
     */
    destroy: function() {
        var me = this;
        delete me.domRef;
        if (me.background) {
            me.background.destroy();
        }
        me.removeAll(true);
        Ext.destroy(me.groups.items);
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
 * @class Ext.layout.component.Draw
 * @private
 *
 */

Ext.define('Ext.layout.component.Draw', {

    /* Begin Definitions */

    alias: 'layout.draw',

    extend:  Ext.layout.component.Auto ,

    setHeightInDom: true,

    setWidthInDom: true,

    /* End Definitions */

    type: 'draw',
    
    measureContentWidth : function (ownerContext) {
        var target = ownerContext.target,
            paddingInfo = ownerContext.getPaddingInfo(),
            bbox = this.getBBox(ownerContext);
            
        if (!target.viewBox) {
            if (target.autoSize) {
                return bbox.width + paddingInfo.width;
            } else {
                return bbox.x + bbox.width + paddingInfo.width;
            }
        } else {
            if (ownerContext.heightModel.shrinkWrap) {
                return paddingInfo.width;
            } else {
                return bbox.width / bbox.height * (ownerContext.getProp('contentHeight') - paddingInfo.height) + paddingInfo.width;
            }
        }
    },
    
    measureContentHeight : function (ownerContext) {
        var target = ownerContext.target,
            paddingInfo = ownerContext.getPaddingInfo(),
            bbox = this.getBBox(ownerContext);
            
        if (!ownerContext.target.viewBox) {
            if (target.autoSize) {
                return bbox.height + paddingInfo.height;
            } else {
                return bbox.y + bbox.height + paddingInfo.height;
            }
        } else {
            if (ownerContext.widthModel.shrinkWrap) {
                return paddingInfo.height;
            } else {
                return bbox.height / bbox.width * (ownerContext.getProp('contentWidth') - paddingInfo.width) + paddingInfo.height;
            }
        }
    },
    
    getBBox: function(ownerContext) {
        var bbox = ownerContext.surfaceBBox;
        if (!bbox) {
            bbox = ownerContext.target.surface.items.getBBox();
            // If the surface is empty, we'll get these values, normalize them
            if (bbox.width === -Infinity && bbox.height === -Infinity) {
                bbox.width = bbox.height = bbox.x = bbox.y = 0;
            }
            ownerContext.surfaceBBox = bbox;
        }
        return bbox;
    },

    publishInnerWidth: function (ownerContext, width) {
        ownerContext.setContentWidth(width - ownerContext.getFrameInfo().width, true);
    },
    
    publishInnerHeight: function (ownerContext, height) {
        ownerContext.setContentHeight(height - ownerContext.getFrameInfo().height, true);
    },
    
    finishedLayout: function (ownerContext) {
        // TODO: Is there a better way doing this?
        var props = ownerContext.props,
            paddingInfo = ownerContext.getPaddingInfo();

        // We don't want the cost of getProps, so we just use the props data... this is ok
        // because all the props have been calculated by this time
        this.owner.setSurfaceSize(props.contentWidth - paddingInfo.width, props.contentHeight - paddingInfo.height);
        
        // calls afterComponentLayout, so we want the surface to be sized before that:
        this.callParent(arguments);
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
 * The Draw Component is a surface in which sprites can be rendered. The Draw Component
 * manages and holds an {@link Ext.draw.Surface} instance where
 * {@link Ext.draw.Sprite Sprites} can be appended.
 *
 * One way to create a draw component is:
 *
 *     @example
 *     var drawComponent = Ext.create('Ext.draw.Component', {
 *         viewBox: false,
 *         items: [{
 *             type: 'circle',
 *             fill: '#79BB3F',
 *             radius: 100,
 *             x: 100,
 *             y: 100
 *         }]
 *     });
 *
 *     Ext.create('Ext.Window', {
 *         width: 215,
 *         height: 235,
 *         layout: 'fit',
 *         items: [drawComponent]
 *     }).show();
 *
 * In this case we created a draw component and added a {@link Ext.draw.Sprite sprite} to it.
 * The {@link Ext.draw.Sprite#type type} of the sprite is `circle` so if you run this code you'll see a yellow-ish
 * circle in a Window. When setting `viewBox` to `false` we are responsible for setting the object's position and
 * dimensions accordingly.
 *
 * You can also add sprites by using the surface's add method:
 *
 *     drawComponent.surface.add({
 *         type: 'circle',
 *         fill: '#79BB3F',
 *         radius: 100,
 *         x: 100,
 *         y: 100
 *     });
 *
 * ## Larger example
 *
 *     @example
 *     var drawComponent = Ext.create('Ext.draw.Component', {
 *         width: 800,
 *         height: 600,
 *         renderTo: document.body
 *     }), surface = drawComponent.surface;
 *
 *     surface.add([{
 *         type: 'circle',
 *         radius: 10,
 *         fill: '#f00',
 *         x: 10,
 *         y: 10,
 *         group: 'circles'
 *     }, {
 *         type: 'circle',
 *         radius: 10,
 *         fill: '#0f0',
 *         x: 50,
 *         y: 50,
 *         group: 'circles'
 *     }, {
 *         type: 'circle',
 *         radius: 10,
 *         fill: '#00f',
 *         x: 100,
 *         y: 100,
 *         group: 'circles'
 *     }, {
 *         type: 'rect',
 *         width: 20,
 *         height: 20,
 *         fill: '#f00',
 *         x: 10,
 *         y: 10,
 *         group: 'rectangles'
 *     }, {
 *         type: 'rect',
 *         width: 20,
 *         height: 20,
 *         fill: '#0f0',
 *         x: 50,
 *         y: 50,
 *         group: 'rectangles'
 *     }, {
 *         type: 'rect',
 *         width: 20,
 *         height: 20,
 *         fill: '#00f',
 *         x: 100,
 *         y: 100,
 *         group: 'rectangles'
 *     }]);
 *
 *     // Get references to my groups
 *     circles = surface.getGroup('circles');
 *     rectangles = surface.getGroup('rectangles');
 *
 *     // Animate the circles down
 *     circles.animate({
 *         duration: 1000,
 *         to: {
 *             translate: {
 *                 y: 200
 *             }
 *         }
 *     });
 *
 *     // Animate the rectangles across
 *     rectangles.animate({
 *         duration: 1000,
 *         to: {
 *             translate: {
 *                 x: 200
 *             }
 *         }
 *     });
 *
 * For more information on Sprites, the core elements added to a draw component's surface,
 * refer to the {@link Ext.draw.Sprite} documentation.
 */
Ext.define('Ext.draw.Component', {

    /* Begin Definitions */

    alias: 'widget.draw',

    extend:  Ext.Component ,

               
                           
                                   
      

    /* End Definitions */

    /**
     * @cfg {String[]} enginePriority
     * Defines the priority order for which Surface implementation to use. The first
     * one supported by the current environment will be used.
     */
    enginePriority: ['Svg', 'Vml'],

    baseCls: Ext.baseCSSPrefix + 'surface',

    componentLayout: 'draw',

    /**
     * @cfg {Boolean} viewBox
     * Turn on view box support which will scale and position items in the draw component to fit to the component while
     * maintaining aspect ratio. Note that this scaling can override other sizing settings on your items.
     */
    viewBox: true,

    shrinkWrap: 3,
    
    /**
     * @cfg {Boolean} autoSize
     * Turn on autoSize support which will set the bounding div's size to the natural size of the contents.
     */
    autoSize: false,

    /**
     * @cfg {Object[]} gradients (optional) Define a set of gradients that can be used as `fill` property in sprites.
     * The gradients array is an array of objects with the following properties:
     *
     *  - `id` - string - The unique name of the gradient.
     *  - `angle` - number, optional - The angle of the gradient in degrees.
     *  - `stops` - object - An object with numbers as keys (from 0 to 100) and style objects as values
     *
     * ## Example
     *
     *     gradients: [{
     *         id: 'gradientId',
     *         angle: 45,
     *         stops: {
     *             0: {
     *                 color: '#555'
     *             },
     *             100: {
     *                 color: '#ddd'
     *             }
     *         }
     *     }, {
     *         id: 'gradientId2',
     *         angle: 0,
     *         stops: {
     *             0: {
     *                 color: '#590'
     *             },
     *             20: {
     *                 color: '#599'
     *             },
     *             100: {
     *                 color: '#ddd'
     *             }
     *         }
     *     }]
     *
     * Then the sprites can use `gradientId` and `gradientId2` by setting the fill attributes to those ids, for example:
     *
     *     sprite.setAttributes({
     *         fill: 'url(#gradientId)'
     *     }, true);
     */

    /**
     * @cfg {Ext.draw.Sprite[]} items
     * Array of sprites or sprite config objects to add initially to the surface.
     */

    /**
     * @property {Ext.draw.Surface} surface
     * The Surface instance managed by this component.
     */

    initComponent: function() {
        this.callParent(arguments);

        this.addEvents(
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#mousedown
             */
            'mousedown',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#mouseup
             */
            'mouseup',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#mousemove
             */
            'mousemove',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#mouseenter
             */
            'mouseenter',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#mouseleave
             */
            'mouseleave',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#click
             */
            'click',
            /**
             * @event
             * Event forwarded from {@link Ext.draw.Surface surface}.
             * @inheritdoc Ext.draw.Surface#dblclick
             */
            'dblclick'
        );
    },

    /**
     * @private
     *
     * Create the Surface on initial render
     */
    onRender: function() {
        var me = this,
            viewBox = me.viewBox,
            autoSize = me.autoSize,
            bbox, items, width, height, x, y;
        me.callParent(arguments);

        if (me.createSurface() !== false) {
            items = me.surface.items;

            if (viewBox || autoSize) {
                bbox = items.getBBox();
                width = bbox.width;
                height = bbox.height;
                x = bbox.x;
                y = bbox.y;
                if (me.viewBox) {
                    me.surface.setViewBox(x, y, width, height);
                } else {
                    me.autoSizeSurface();
                }
            }
        }
    },

    // @private
    autoSizeSurface: function() {
        var bbox = this.surface.items.getBBox();
        this.setSurfaceSize(bbox.width, bbox.height);
    },

    setSurfaceSize: function (width, height) {
        this.surface.setSize(width, height);
        if (this.autoSize) {
            var bbox = this.surface.items.getBBox();
            this.surface.setViewBox(bbox.x, bbox.y - (+Ext.isOpera), width, height);
        }
    },
    
    /**
     * Create the Surface instance. Resolves the correct Surface implementation to
     * instantiate based on the 'enginePriority' config. Once the Surface instance is
     * created you can use the handle to that instance to add sprites. For example:
     *
     *     drawComponent.surface.add(sprite);
     *
     * @private
     */
    createSurface: function() {
        var me = this,
            cfg = Ext.applyIf({
                renderTo: me.el,
                height: me.height,
                width: me.width,
                items: me.items
            }, me.initialConfig), surface;

        // ensure we remove any listeners to prevent duplicate events since we refire them below
        delete cfg.listeners;
        if (!cfg.gradients) {
            cfg.gradients = me.gradients;
        }
        surface = Ext.draw.Surface.create(cfg, me.enginePriority);
        if (!surface) {
            // In case we cannot create a surface, return false so we can stop
            return false;
        }
        me.surface = surface;


        function refire(eventName) {
            return function(e) {
                me.fireEvent(eventName, e);
            };
        }

        surface.on({
            scope: me,
            mouseup: refire('mouseup'),
            mousedown: refire('mousedown'),
            mousemove: refire('mousemove'),
            mouseenter: refire('mouseenter'),
            mouseleave: refire('mouseleave'),
            click: refire('click'),
            dblclick: refire('dblclick')
        });
    },


    /**
     * @private
     *
     * Clean up the Surface instance on component destruction
     */
    onDestroy: function() {
        Ext.destroy(this.surface);
        this.callParent(arguments);
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
 * @class Ext.chart.theme.Theme
 * 
 * Provides chart theming.
 * 
 * Used as mixins by Ext.chart.Chart.
 */
Ext.chart = Ext.chart || {};

Ext.define('Ext.chart.theme.Theme', (

// This callback is executed right after when the class is created. This scope refers to the newly created class itself
function() {
   /* Theme constructor: takes either a complex object with styles like:
  
   {
        axis: {
            fill: '#000',
            'stroke-width': 1
        },
        axisLabelTop: {
            fill: '#000',
            font: '11px Arial'
        },
        axisLabelLeft: {
            fill: '#000',
            font: '11px Arial'
        },
        axisLabelRight: {
            fill: '#000',
            font: '11px Arial'
        },
        axisLabelBottom: {
            fill: '#000',
            font: '11px Arial'
        },
        axisTitleTop: {
            fill: '#000',
            font: '11px Arial'
        },
        axisTitleLeft: {
            fill: '#000',
            font: '11px Arial'
        },
        axisTitleRight: {
            fill: '#000',
            font: '11px Arial'
        },
        axisTitleBottom: {
            fill: '#000',
            font: '11px Arial'
        },
        series: {
            'stroke-width': 1
        },
        seriesLabel: {
            font: '12px Arial',
            fill: '#333'
        },
        marker: {
            stroke: '#555',
            fill: '#000',
            radius: 3,
            size: 3
        },
        seriesThemes: [{
            fill: '#C6DBEF'
        }, {
            fill: '#9ECAE1'
        }, {
            fill: '#6BAED6'
        }, {
            fill: '#4292C6'
        }, {
            fill: '#2171B5'
        }, {
            fill: '#084594'
        }],
        markerThemes: [{
            fill: '#084594',
            type: 'circle' 
        }, {
            fill: '#2171B5',
            type: 'cross'
        }, {
            fill: '#4292C6',
            type: 'plus'
        }]
    }
  
  ...or also takes just an array of colors and creates the complex object:
  
  {
      colors: ['#aaa', '#bcd', '#eee']
  }
  
  ...or takes just a base color and makes a theme from it
  
  {
      baseColor: '#bce'
  }
  
  To create a new theme you may add it to the Themes object:
  
  Ext.chart.theme.MyNewTheme = Ext.extend(Object, {
      constructor: function(config) {
          Ext.chart.theme.call(this, config, {
              baseColor: '#mybasecolor'
          });
      }
  });
  
  //Proposal:
  Ext.chart.theme.MyNewTheme = Ext.chart.createTheme('#basecolor');
  
  ...and then to use it provide the name of the theme (as a lower case string) in the chart config.
  
  {
      theme: 'mynewtheme'
  }
 */

(function() {
    Ext.chart.theme = function(config, base) {
        config = config || {};
        var i = 0, d = Ext.Date.now(), l, colors, color,
            seriesThemes, markerThemes,
            seriesTheme, markerTheme, 
            key, gradients = [],
            midColor, midL;
        
        if (config.baseColor) {
            midColor = Ext.draw.Color.fromString(config.baseColor);
            midL = midColor.getHSL()[2];
            if (midL < 0.15) {
                midColor = midColor.getLighter(0.3);
            } else if (midL < 0.3) {
                midColor = midColor.getLighter(0.15);
            } else if (midL > 0.85) {
                midColor = midColor.getDarker(0.3);
            } else if (midL > 0.7) {
                midColor = midColor.getDarker(0.15);
            }
            config.colors = [ midColor.getDarker(0.3).toString(),
                              midColor.getDarker(0.15).toString(),
                              midColor.toString(),
                              midColor.getLighter(0.15).toString(),
                              midColor.getLighter(0.3).toString()];

            delete config.baseColor;
        }
        if (config.colors) {
            colors = config.colors.slice();
            markerThemes = base.markerThemes;
            seriesThemes = base.seriesThemes;
            l = colors.length;
            base.colors = colors;
            for (; i < l; i++) {
                color = colors[i];
                markerTheme = markerThemes[i] || {};
                seriesTheme = seriesThemes[i] || {};
                markerTheme.fill = seriesTheme.fill = markerTheme.stroke = seriesTheme.stroke = color;
                markerThemes[i] = markerTheme;
                seriesThemes[i] = seriesTheme;
            }
            base.markerThemes = markerThemes.slice(0, l);
            base.seriesThemes = seriesThemes.slice(0, l);
        //the user is configuring something in particular (either markers, series or pie slices)
        }
        for (key in base) {
            if (key in config) {
                if (Ext.isObject(config[key]) && Ext.isObject(base[key])) {
                    Ext.apply(base[key], config[key]);
                } else {
                    base[key] = config[key];
                }
            }
        }
        if (config.useGradients) {
            colors = base.colors || (function () {
                var ans = [];
                for (i = 0, seriesThemes = base.seriesThemes, l = seriesThemes.length; i < l; i++) {
                    ans.push(seriesThemes[i].fill || seriesThemes[i].stroke);
                }
                return ans;
            }());
            for (i = 0, l = colors.length; i < l; i++) {
                midColor = Ext.draw.Color.fromString(colors[i]);
                if (midColor) {
                    color = midColor.getDarker(0.1).toString();
                    midColor = midColor.toString();
                    key = 'theme-' + midColor.substr(1) + '-' + color.substr(1) + '-' + d;
                    gradients.push({
                        id: key,
                        angle: 45,
                        stops: {
                            0: {
                                color: midColor.toString()
                            },
                            100: {
                                color: color.toString()
                            }
                        }
                    });
                    colors[i] = 'url(#' + key + ')'; 
                }
            }
            base.gradients = gradients;
            base.colors = colors;
        }
        /*
        base.axis = Ext.apply(base.axis || {}, config.axis || {});
        base.axisLabel = Ext.apply(base.axisLabel || {}, config.axisLabel || {});
        base.axisTitle = Ext.apply(base.axisTitle || {}, config.axisTitle || {});
        */
        Ext.apply(this, base);
    };
}());

return {

    /* Begin Definitions */

                                 

    /* End Definitions */

    theme: 'Base',
    themeAttrs: false,

    initTheme: function(theme) {
        var me = this,
            themes = Ext.chart.theme,
            key, gradients;
        if (theme) {
            theme = theme.split(':');
            for (key in themes) {
                if (key == theme[0]) {
                    gradients = theme[1] == 'gradients';
                    me.themeAttrs = new themes[key]({
                        useGradients: gradients
                    });
                    if (gradients) {
                        me.gradients = me.themeAttrs.gradients;
                    }
                    if (me.themeAttrs.background) {
                        me.background = me.themeAttrs.background;
                    }
                    return;
                }
            }
        }
    }
};

})());

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
Ext.define('Ext.chart.MaskLayer', {
    extend:  Ext.Component ,
    
    constructor: function(config) {
        config = Ext.apply(config || {}, {
            style: 'position:absolute;background-color:#ff9;cursor:crosshair;opacity:0.5;border:1px solid #00f;'
        });
        this.callParent([config]);    
    },
    
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.addEvents(
            'mousedown',
            'mouseup',
            'mousemove',
            'mouseenter',
            'mouseleave'
        );
    },

    initDraggable: function() {
        this.callParent(arguments);
        this.dd.onStart = function (e) {
            var me = this,
                comp = me.comp;
    
            // Cache the start [X, Y] array
            this.startPosition = comp.getPosition(true);
    
            // If client Component has a ghost method to show a lightweight version of itself
            // then use that as a drag proxy unless configured to liveDrag.
            if (comp.ghost && !comp.liveDrag) {
                 me.proxy = comp.ghost();
                 me.dragTarget = me.proxy.header.el;
            }
    
            // Set the constrainTo Region before we start dragging.
            if (me.constrain || me.constrainDelegate) {
                me.constrainTo = me.calculateConstrainRegion();
            }
        };
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
 * Defines a mask for a chart's series.
 * The 'chart' member must be set prior to rendering.
 *
 * A Mask can be used to select a certain region in a chart.
 * When enabled, the `select` event will be triggered when a
 * region is selected by the mask, allowing the user to perform
 * other tasks like zooming on that region, etc.
 *
 * In order to use the mask one has to set the Chart `mask` option to
 * `true`, `vertical` or `horizontal`. Then a possible configuration for the
 * listener could be:
 *
 *     items: {
 *         xtype: 'chart',
 *         animate: true,
 *         store: store1,
 *         mask: 'horizontal',
 *         listeners: {
 *             select: {
 *                 fn: function(me, selection) {
 *                     me.setZoom(selection);
 *                     me.mask.hide();
 *                 }
 *             }
 *         }
 *     }
 *
 * In this example we zoom the chart to that particular region. You can also get
 * a handle to a mask instance from the chart object. The `chart.mask` element is a
 * `Ext.Panel`.
 * 
 */
Ext.define('Ext.chart.Mask', {
               
                             
      
    
    /**
     * @cfg {Boolean/String} mask
     * Enables selecting a region on chart. True to enable any selection,
     * 'horizontal' or 'vertical' to restrict the selection to X or Y axis.
     *
     * The mask in itself will do nothing but fire 'select' event.
     * See {@link Ext.chart.Mask} for example.
     */

    /**
     * Creates new Mask.
     * @param {Object} [config] Config object.
     */
    constructor: function(config) {
        var me = this;

        me.addEvents('select');

        if (config) {
            Ext.apply(me, config);
        }
        if (me.enableMask) {
            me.on('afterrender', function() {
                //create a mask layer component
                var comp = new Ext.chart.MaskLayer({
                    renderTo: me.el,
                    hidden: true
                });
                comp.el.on({
                    'mousemove': function(e) {
                        me.onMouseMove(e);
                    },
                    'mouseup': function(e) {
                        me.onMouseUp(e);
                    }
                });
                comp.initDraggable();
                me.maskType = me.mask;
                me.mask = comp;
                me.maskSprite = me.surface.add({
                    type: 'path',
                    path: ['M', 0, 0],
                    zIndex: 1001,
                    opacity: 0.6,
                    hidden: true,
                    stroke: '#00f',
                    cursor: 'crosshair'
                });
            }, me, { single: true });
        }
    },

    onMouseUp: function(e) {
        var me = this,
            bbox = me.bbox || me.chartBBox,
            sel;
        me.maskMouseDown = false;
        me.mouseDown = false;
        if (me.mouseMoved) {
            me.handleMouseEvent(e);
            me.mouseMoved = false;
            sel = me.maskSelection;
            me.fireEvent('select', me, {
                x: sel.x - bbox.x,
                y: sel.y - bbox.y,
                width: sel.width,
                height: sel.height
            });
        }
    },

    onMouseDown: function(e) {
        this.handleMouseEvent(e);
    },

    onMouseMove: function(e) {
        this.handleMouseEvent(e);
    },

    handleMouseEvent: function(e) {
        var me = this,
            mask = me.maskType,
            bbox = me.bbox || me.chartBBox,
            x = bbox.x,
            y = bbox.y,
            math = Math,
            floor = math.floor,
            abs = math.abs,
            min = math.min,
            max = math.max,
            height = floor(y + bbox.height),
            width = floor(x + bbox.width),
            staticX = e.getPageX() - me.el.getX(),
            staticY = e.getPageY() - me.el.getY(),
            maskMouseDown = me.maskMouseDown,
            path;

        staticX = max(staticX, x);
        staticY = max(staticY, y);
        staticX = min(staticX, width);
        staticY = min(staticY, height);

        if (e.type === 'mousedown') {
            // remember the cursor location
            me.mouseDown = true;
            me.mouseMoved = false;
            me.maskMouseDown = {
                x: staticX,
                y: staticY
            };
        }
        else {
            // mousedown or mouseup:
            // track the cursor to display the selection
            me.mouseMoved = me.mouseDown;
            if (maskMouseDown && me.mouseDown) {
                if (mask == 'horizontal') {
                    staticY = y;
                    maskMouseDown.y = height;
                }
                else if (mask == 'vertical') {
                    staticX = x;
                    maskMouseDown.x = width;
                }
                width = maskMouseDown.x - staticX;
                height = maskMouseDown.y - staticY;
                path = ['M', staticX, staticY, 'l', width, 0, 0, height, -width, 0, 'z'];
                me.maskSelection = {
                    x: (width > 0 ? staticX : staticX + width) + me.el.getX(),
                    y: (height > 0 ? staticY : staticY + height) + me.el.getY(),
                    width: abs(width),
                    height: abs(height)
                };
                me.mask.updateBox(me.maskSelection);
                me.mask.show();
                me.maskSprite.setAttributes({
                    hidden: true    
                }, true);
            }
            else {
                if (mask == 'horizontal') {
                    path = ['M', staticX, y, 'L', staticX, height];
                }
                else if (mask == 'vertical') {
                    path = ['M', x, staticY, 'L', width, staticY];
                }
                else {
                    path = ['M', staticX, y, 'L', staticX, height, 'M', x, staticY, 'L', width, staticY];
                }
                me.maskSprite.setAttributes({
                    path: path,
                    'stroke-width': mask === true ? 1 : 1,
                    hidden: false
                }, true);
            }
        }

    },

    onMouseLeave: function(e) {
        var me = this;
        me.mouseMoved = false;
        me.mouseDown = false;
        me.maskMouseDown = false;
        me.mask.hide();
        me.maskSprite.hide(true);
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
 * @class Ext.chart.Navigation
 *
 * Handles panning and zooming capabilities.
 *
 * Used as mixin by Ext.chart.Chart.
 */
Ext.define('Ext.chart.Navigation', {

    /**
     * Zooms the chart to the specified selection range.
     * Can be used with a selection mask. For example:
     *
     *     items: {
     *         xtype: 'chart',
     *         animate: true,
     *         store: store1,
     *         mask: 'horizontal',
     *         listeners: {
     *             select: {
     *                 fn: function(me, selection) {
     *                     me.setZoom(selection);
     *                     me.mask.hide();
     *                 }
     *             }
     *         }
     *     }
     */
    setZoom: function(zoomConfig) {
        var me = this,
            axesItems = me.axes.items,
            i, ln, axis,
            bbox = me.chartBBox,
            xScale = bbox.width,
            yScale = bbox.height,
            zoomArea = {
                x : zoomConfig.x - me.el.getX(),
                y : zoomConfig.y - me.el.getY(),
                width : zoomConfig.width,
                height : zoomConfig.height
            },
            zoomer, ends, from, to, store, count, step, length, horizontal;

        for (i = 0, ln = axesItems.length; i < ln; i++) {
            axis = axesItems[i];
            horizontal = (axis.position == 'bottom' || axis.position == 'top');
            if (axis.type == 'Category') {
                if (!store) {
                    store = me.getChartStore();
                    count = store.data.items.length;
                }
                zoomer = zoomArea;
                length = axis.length;
                step = Math.round(length / count);
                if (horizontal) {
                    from = (zoomer.x ? Math.floor(zoomer.x / step) + 1 : 0);
                    to = (zoomer.x + zoomer.width) / step;
                } else {
                    from = (zoomer.y ? Math.floor(zoomer.y / step) + 1 : 0);
                    to = (zoomer.y + zoomer.height) / step;
                }
            }
            else {
                zoomer = {
                    x : zoomArea.x / xScale,
                    y : zoomArea.y / yScale,
                    width : zoomArea.width / xScale,
                    height : zoomArea.height / yScale
                }
                ends = axis.calcEnds();
                if (horizontal) {
                    from = (ends.to - ends.from) * zoomer.x + ends.from;
                    to = (ends.to - ends.from) * zoomer.width + from;
                } else {
                    to = (ends.to - ends.from) * (1 - zoomer.y) + ends.from;
                    from = to - (ends.to - ends.from) * zoomer.height;
                }
            }
            axis.minimum = from;
            axis.maximum = to;
            if (horizontal) {
                if (axis.doConstrain && me.maskType != 'vertical') {
                    axis.doConstrain();
                }
            }
            else {
                if (axis.doConstrain && me.maskType != 'horizontal') {
                    axis.doConstrain();
                }
            }
        }
        me.redraw(false);
    },

    /**
     * Restores the zoom to the original value. This can be used to reset
     * the previous zoom state set by `setZoom`. For example:
     *
     *     myChart.restoreZoom();
     */
    restoreZoom: function() {
        var me = this,
            axesItems = me.axes.items,
            i, ln, axis;

        me.setSubStore(null);
        for (i = 0, ln = axesItems.length; i < ln; i++) {
            axis = axesItems[i];
            delete axis.minimum;
            delete axis.maximum;
        }
        me.redraw(false);
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
Ext.define('Ext.chart.Shape', {

    /* Begin Definitions */

    singleton: true,

    /* End Definitions */

    circle: function (surface, opts) {
        return surface.add(Ext.apply({
            type: 'circle',
            x: opts.x,
            y: opts.y,
            stroke: null,
            radius: opts.radius
        }, opts));
    },
    line: function (surface, opts) {
        return surface.add(Ext.apply({
            type: 'rect',
            x: opts.x - opts.radius,
            y: opts.y - opts.radius,
            height: 2 * opts.radius,
            width: 2 * opts.radius / 5
        }, opts));
    },
    square: function (surface, opts) {
        return surface.add(Ext.applyIf({
            type: 'rect',
            x: opts.x - opts.radius,
            y: opts.y - opts.radius,
            height: 2 * opts.radius,
            width: 2 * opts.radius,
            radius: null
        }, opts));
    },
    triangle: function (surface, opts) {
        opts.radius *= 1.75;
        return surface.add(Ext.apply({
            type: 'path',
            stroke: null,
            path: "M".concat(opts.x, ",", opts.y, "m0-", opts.radius * 0.58, "l", opts.radius * 0.5, ",", opts.radius * 0.87, "-", opts.radius, ",0z")
        }, opts));
    },
    diamond: function (surface, opts) {
        var r = opts.radius;
        r *= 1.5;
        return surface.add(Ext.apply({
            type: 'path',
            stroke: null,
            path: ["M", opts.x, opts.y - r, "l", r, r, -r, r, -r, -r, r, -r, "z"]
        }, opts));
    },
    cross: function (surface, opts) {
        var r = opts.radius;
        r = r / 1.7;
        return surface.add(Ext.apply({
            type: 'path',
            stroke: null,
            path: "M".concat(opts.x - r, ",", opts.y, "l", [-r, -r, r, -r, r, r, r, -r, r, r, -r, r, r, r, -r, r, -r, -r, -r, r, -r, -r, "z"])
        }, opts));
    },
    plus: function (surface, opts) {
        var r = opts.radius / 1.3;
        return surface.add(Ext.apply({
            type: 'path',
            stroke: null,
            path: "M".concat(opts.x - r / 2, ",", opts.y - r / 2, "l", [0, -r, r, 0, 0, r, r, 0, 0, r, -r, 0, 0, r, -r, 0, 0, -r, -r, 0, 0, -r, "z"])
        }, opts));
    },
    arrow: function (surface, opts) {
        var r = opts.radius;
        return surface.add(Ext.apply({
            type: 'path',
            path: "M".concat(opts.x - r * 0.7, ",", opts.y - r * 0.4, "l", [r * 0.6, 0, 0, -r * 0.4, r, r * 0.8, -r, r * 0.8, 0, -r * 0.4, -r * 0.6, 0], "z")
        }, opts));
    },
    drop: function (surface, x, y, text, size, angle) {
        size = size || 30;
        angle = angle || 0;
        surface.add({
            type: 'path',
            path: ['M', x, y, 'l', size, 0, 'A', size * 0.4, size * 0.4, 0, 1, 0, x + size * 0.7, y - size * 0.7, 'z'],
            fill: '#000',
            stroke: 'none',
            rotate: {
                degrees: 22.5 - angle,
                x: x,
                y: y
            }
        });
        angle = (angle + 90) * Math.PI / 180;
        surface.add({
            type: 'text',
            x: x + size * Math.sin(angle) - 10, // Shift here, Not sure why.
            y: y + size * Math.cos(angle) + 5,
            text:  text,
            'font-size': size * 12 / 40,
            stroke: 'none',
            fill: '#fff'
        });
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
 * @class Ext.chart.LegendItem
 * A single item of a legend (marker plus label)
 */
Ext.define('Ext.chart.LegendItem', {

    /* Begin Definitions */

    extend:  Ext.draw.CompositeSprite ,

                                  

    /* End Definitions */

    // Controls Series visibility
    hiddenSeries: false,
    
    // These are cached for quick lookups
    label: undefined,
    
    // Position of the item, relative to the upper-left corner of the legend box
    x: 0,
    y: 0,
    zIndex: 500,

    // checks to make sure that a unit size follows the bold keyword in the font style value
    boldRe: /bold\s\d{1,}.*/i,

    constructor: function(config) {
        this.callParent(arguments);
        this.createLegend(config);
    },

    /**
     * Creates all the individual sprites for this legend item
     */
    createLegend: function(config) {
        var me = this,
            series = me.series,
            index = config.yFieldIndex;
            
        me.label = me.createLabel(config);
        me.createSeriesMarkers(config);
        
        me.setAttributes({
            hidden: false
        }, true);
        
        me.yFieldIndex = index;

        // Add event listeners
        me.on('mouseover', me.onMouseOver, me);
        me.on('mouseout',  me.onMouseOut,  me);
        me.on('mousedown', me.onMouseDown, me);
        
        if (!series.visibleInLegend(index)) {
            me.hiddenSeries = true;
            me.label.setAttributes({
               opacity: 0.5
            }, true);
        };

        // Relative to 0,0 at first so that the bbox is calculated correctly
        me.updatePosition({ x: 0, y: 0 }); 
    },
    
    /**
     * @private Retrieves text to be displayed as item label.
     */
    getLabelText: function() {
        var me = this,
            series = me.series,
            idx = me.yFieldIndex;

        function getSeriesProp(name) {
            var val = series[name];
            return (Ext.isArray(val) ? val[idx] : val);
        }
        
        return getSeriesProp('title') || getSeriesProp('yField');
    },
    
    /**
     * @private Creates label sprite.
     */
    createLabel: function(config) {
        var me = this,
            legend = me.legend;
        
        return me.add('label', me.surface.add({
            type: 'text',
            x: 20,
            y: 0,
            zIndex: (me.zIndex || 0) + 2,
            fill: legend.labelColor,
            font: legend.labelFont,
            text: me.getLabelText(),
            style: {
                cursor: 'pointer'
            }
        }));
    },
    
    /**
     * @private Creates Series marker Sprites.
     */
    createSeriesMarkers: function(config) {
        var me = this,
            index = config.yFieldIndex,
            series = me.series,
            seriesType = series.type,
            surface = me.surface,
            z = me.zIndex;

        // Line series - display as short line with optional marker in the middle
        if (seriesType === 'line' || seriesType === 'scatter') {
            if(seriesType === 'line') {
                var seriesStyle = Ext.apply(series.seriesStyle, series.style);
                me.drawLine(0.5, 0.5, 16.5, 0.5, z, seriesStyle, index);
            };
            
            if (series.showMarkers || seriesType === 'scatter') {
                var markerConfig = Ext.apply(series.markerStyle, series.markerConfig || {}, {
                    fill: series.getLegendColor(index)
                });
                me.drawMarker(8.5, 0.5, z, markerConfig);
            }
        }
        // All other series types - display as filled box
        else {
            me.drawFilledBox(12, 12, z, index);
        }
    },
    
    /**
     * @private Creates line sprite for Line series.
     */
    drawLine: function(fromX, fromY, toX, toY, z, seriesStyle, index) {
        var me = this,
            surface = me.surface,
            series = me.series;
        
        return me.add('line', surface.add({
            type: 'path',
            path: 'M' + fromX + ',' + fromY + 'L' + toX + ',' + toY,
            zIndex: (z || 0) + 2,
            "stroke-width": series.lineWidth,
            "stroke-linejoin": "round",
            "stroke-dasharray": series.dash,
            stroke: seriesStyle.stroke || series.getLegendColor(index) || '#000',
            style: {
                cursor: 'pointer'
            }
        }));
    },
    
    /**
     * @private Creates series-shaped marker for Line and Scatter series.
     */
    drawMarker: function(x, y, z, markerConfig) {
        var me = this,
            surface = me.surface,
            series = me.series;

        return me.add('marker', Ext.chart.Shape[markerConfig.type](surface, {
            fill: markerConfig.fill,
            x: x,
            y: y,
            zIndex: (z || 0) + 2,
            radius: markerConfig.radius || markerConfig.size,
            style: {
                cursor: 'pointer'
            }
        }));
    },
    
    /**
     * @private Creates box-shaped marker for all series but Line and Scatter.
     */
    drawFilledBox: function(width, height, z, index) {
        var me = this,
            surface = me.surface,
            series = me.series;
            
        return me.add('box', surface.add({
            type: 'rect',
            zIndex: (z || 0) + 2,
            x: 0,
            y: 0,
            width: width,
            height: height,
            fill: series.getLegendColor(index),
            style: {
                cursor: 'pointer'
            }
        }));
    },
    
    /**
     * @private Draws label in bold when mouse cursor is over the item.
     */
    onMouseOver: function() {
        var me = this;
        
        me.label.setStyle({
            'font-weight': 'bold'
        });
        me.series._index = me.yFieldIndex;
        me.series.highlightItem();
    },
    
    /**
     * @private Draws label in normal when mouse cursor leaves the item.
     */
    onMouseOut: function() {
        var me = this,
            legend = me.legend,
            boldRe = me.boldRe;

        me.label.setStyle({
            'font-weight': legend.labelFont && boldRe.test(legend.labelFont) ? 'bold' : 'normal'
        });
        me.series._index = me.yFieldIndex;
        me.series.unHighlightItem();
    },
    
    /**
     * @private Toggles Series visibility upon mouse click on the item.
     */
    onMouseDown: function() {
        var me = this,
            index = me.yFieldIndex;

        if (!me.hiddenSeries) {
            me.series.hideAll(index);
            me.label.setAttributes({
                opacity: 0.5
            }, true);
        } else {
            me.series.showAll(index);
            me.label.setAttributes({
                opacity: 1
            }, true);
        }
        me.hiddenSeries = !me.hiddenSeries; 
        me.legend.chart.redraw();
    },

    /**
     * Update the positions of all this item's sprites to match the root position
     * of the legend box.
     * @param {Object} relativeTo (optional) If specified, this object's 'x' and 'y' values will be used
     *                 as the reference point for the relative positioning. Defaults to the Legend.
     */
    updatePosition: function(relativeTo) {
        var me = this,
            items = me.items,
            ln = items.length,
            i = 0,
            item;
        if (!relativeTo) {
            relativeTo = me.legend;
        }
        for (; i < ln; i++) {
            item = items[i];
            switch (item.type) {
                case 'text':
                    item.setAttributes({
                        x: 20 + relativeTo.x + me.x,
                        y: relativeTo.y + me.y
                    }, true);
                    break;
                case 'rect':
                    item.setAttributes({
                        translate: {
                            x: relativeTo.x + me.x,
                            y: relativeTo.y + me.y - 6
                        }
                    }, true);
                    break;
                default:
                    item.setAttributes({
                        translate: {
                            x: relativeTo.x + me.x,
                            y: relativeTo.y + me.y
                        }
                    }, true);
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
 * @class Ext.chart.Legend
 *
 * Defines a legend for a chart's series.
 * The 'chart' member must be set prior to rendering.
 * The legend class displays a list of legend items each of them related with a
 * series being rendered. In order to render the legend item of the proper series
 * the series configuration object must have `showInLegend` set to true.
 *
 * The legend configuration object accepts a `position` as parameter.
 * The `position` parameter can be `left`, `right`
 * `top` or `bottom`. For example:
 *
 *     legend: {
 *         position: 'right'
 *     },
 *
 * ## Example
 *
 *     @example
 *     var store = Ext.create('Ext.data.JsonStore', {
 *         fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5'],
 *         data: [
 *             { 'name': 'metric one',   'data1': 10, 'data2': 12, 'data3': 14, 'data4': 8,  'data5': 13 },
 *             { 'name': 'metric two',   'data1': 7,  'data2': 8,  'data3': 16, 'data4': 10, 'data5': 3  },
 *             { 'name': 'metric three', 'data1': 5,  'data2': 2,  'data3': 14, 'data4': 12, 'data5': 7  },
 *             { 'name': 'metric four',  'data1': 2,  'data2': 14, 'data3': 6,  'data4': 1,  'data5': 23 },
 *             { 'name': 'metric five',  'data1': 27, 'data2': 38, 'data3': 36, 'data4': 13, 'data5': 33 }
 *         ]
 *     });
 *
 *     Ext.create('Ext.chart.Chart', {
 *         renderTo: Ext.getBody(),
 *         width: 500,
 *         height: 300,
 *         animate: true,
 *         store: store,
 *         shadow: true,
 *         theme: 'Category1',
 *         legend: {
 *             position: 'top'
 *         },
 *         axes: [
 *             {
 *                 type: 'Numeric',
 *                 position: 'left',
 *                 fields: ['data1', 'data2', 'data3', 'data4', 'data5'],
 *                 title: 'Sample Values',
 *                 grid: {
 *                     odd: {
 *                         opacity: 1,
 *                         fill: '#ddd',
 *                         stroke: '#bbb',
 *                         'stroke-width': 1
 *                     }
 *                 },
 *                 minimum: 0,
 *                 adjustMinimumByMajorUnit: 0
 *             },
 *             {
 *                 type: 'Category',
 *                 position: 'bottom',
 *                 fields: ['name'],
 *                 title: 'Sample Metrics',
 *                 grid: true,
 *                 label: {
 *                     rotate: {
 *                         degrees: 315
 *                     }
 *                 }
 *             }
 *         ],
 *         series: [{
 *             type: 'area',
 *             highlight: false,
 *             axis: 'left',
 *             xField: 'name',
 *             yField: ['data1', 'data2', 'data3', 'data4', 'data5'],
 *             style: {
 *                 opacity: 0.93
 *             }
 *         }]
 *     });
 */
Ext.define('Ext.chart.Legend', {

    /* Begin Definitions */

                                       

    /* End Definitions */

    /**
     * @cfg {Boolean} visible
     * Whether or not the legend should be displayed.
     */
    visible: true,
    
    /**
     * @cfg {Boolean} update
     * If set to true the legend will be refreshed when the chart is.
     * This is useful to update the legend items if series are
     * added/removed/updated from the chart. Default is true.
     */
    update: true,

    /**
     * @cfg {String} position
     * The position of the legend in relation to the chart. One of: "top",
     * "bottom", "left", "right", or "float". If set to "float", then the legend
     * box will be positioned at the point denoted by the x and y parameters.
     */
    position: 'bottom',

    /**
     * @cfg {Number} x
     * X-position of the legend box. Used directly if position is set to "float", otherwise
     * it will be calculated dynamically.
     */
    x: 0,

    /**
     * @cfg {Number} y
     * Y-position of the legend box. Used directly if position is set to "float", otherwise
     * it will be calculated dynamically.
     */
    y: 0,

    /**
     * @cfg {String} labelColor
     * Color to be used for the legend labels, eg '#000'
     */
    labelColor: '#000',

    /**
     * @cfg {String} labelFont
     * Font to be used for the legend labels, eg '12px Helvetica'
     */
    labelFont: '12px Helvetica, sans-serif',

    /**
     * @cfg {String} boxStroke
     * Style of the stroke for the legend box
     */
    boxStroke: '#000',

    /**
     * @cfg {String} boxStrokeWidth
     * Width of the stroke for the legend box
     */
    boxStrokeWidth: 1,

    /**
     * @cfg {String} boxFill
     * Fill style for the legend box
     */
    boxFill: '#FFF',

    /**
     * @cfg {Number} itemSpacing
     * Amount of space between legend items
     */
    itemSpacing: 10,

    /**
     * @cfg {Number} padding
     * Amount of padding between the legend box's border and its items
     */
    padding: 5,

    // @private
    width: 0,
    // @private
    height: 0,

    /**
     * @cfg {Number} boxZIndex
     * Sets the z-index for the legend. Defaults to 100.
     */
    boxZIndex: 100,

    /**
     * Creates new Legend.
     * @param {Object} config  (optional) Config object.
     */
    constructor: function(config) {
        var me = this;
        if (config) {
            Ext.apply(me, config);
        }
        me.items = [];
        /**
         * Whether the legend box is oriented vertically, i.e. if it is on the left or right side or floating.
         * @type {Boolean}
         */
        me.isVertical = ("left|right|float".indexOf(me.position) !== -1);

        // cache these here since they may get modified later on
        me.origX = me.x;
        me.origY = me.y;
    },

    /**
     * @private Create all the sprites for the legend
     */
    create: function() {
        var me = this,
            seriesItems = me.chart.series.items,
            i, ln, series;

        me.createBox();
        
        if (me.rebuild !== false) {
            me.createItems();
        }
        
        if (!me.created && me.isDisplayed()) {
            me.created = true;

            // Listen for changes to series titles to trigger regeneration of the legend
            for (i = 0, ln = seriesItems.length; i < ln; i++) {
                series = seriesItems[i];
                series.on('titlechange', me.redraw, me);
            }
        }
    },

    /**
     * @private Redraws the Legend
     */
    redraw: function() {
        var me = this;
        
        me.create();
        me.updatePosition();
    },

    /**
     * @private Determine whether the legend should be displayed. Looks at the legend's 'visible' config,
     * and also the 'showInLegend' config for each of the series.
     */
    isDisplayed: function() {
        return this.visible && this.chart.series.findIndex('showInLegend', true) !== -1;
    },

    /**
     * @private Create the series markers and labels
     */
    createItems: function() {
        var me = this,
            seriesItems = me.chart.series.items,
            items = me.items,
            fields, i, li, j, lj, series, item;

        //remove all legend items
        me.removeItems();
        
        // Create all the item labels
        for (i = 0, li = seriesItems.length; i < li; i++) {
            series = seriesItems[i];
            
            if (series.showInLegend) {
                fields = [].concat(series.yField);
                
                for (j = 0, lj = fields.length; j < lj; j++) {
                    item = me.createLegendItem(series, j);
                    items.push(item);
                }
            }
        }
        
        me.alignItems();
    },
    
    /**
     * @private Removes all legend items.
     */
    removeItems: function() {
        var me = this,
            items = me.items,
            len = items ? items.length : 0,
            i;

        if (len) {
            for (i = 0; i < len; i++) {
                items[i].destroy();
            }
        }
        
        //empty array
        items.length = [];
    },
    
    /**
     * @private
     * Positions all items within Legend box.
     */
    alignItems: function() {
        var me = this,
            padding = me.padding,
            vertical = me.isVertical,
            mfloor = Math.floor,
            dim, maxWidth, maxHeight, totalWidth, totalHeight;
        
        dim = me.updateItemDimensions();

        maxWidth    = dim.maxWidth;
        maxHeight   = dim.maxHeight;
        totalWidth  = dim.totalWidth;
        totalHeight = dim.totalHeight;

        // Store the collected dimensions for later
        me.width = mfloor((vertical ? maxWidth : totalWidth) + padding * 2);
        me.height = mfloor((vertical ? totalHeight : maxHeight) + padding * 2);
    },
    
    updateItemDimensions: function() {
        var me = this,
            items = me.items,
            padding = me.padding,
            itemSpacing = me.itemSpacing,
            maxWidth = 0,
            maxHeight = 0,
            totalWidth = 0,
            totalHeight = 0,
            vertical = me.isVertical,
            mfloor = Math.floor,
            mmax = Math.max,
            spacing = 0,
            i, l, item, bbox, width, height;

        // Collect item dimensions and position each one
        // properly in relation to the previous item
        for (i = 0, l = items.length; i < l; i++) {
            item = items[i];
                
            bbox = item.getBBox();

            //always measure from x=0, since not all markers go all the way to the left
            width  = bbox.width;
            height = bbox.height;

            spacing = (i === 0 ? 0 : itemSpacing);
            
            // Set the item's position relative to the legend box
            item.x = padding + mfloor(vertical ? 0 : totalWidth + spacing);
            item.y = padding + mfloor(vertical ? totalHeight + spacing : 0) + height / 2;

            // Collect cumulative dimensions
            totalWidth  += spacing + width;
            totalHeight += spacing + height;
            maxWidth     = mmax(maxWidth, width);
            maxHeight    = mmax(maxHeight, height);
        }

        return {
            totalWidth:  totalWidth,
            totalHeight: totalHeight,
            maxWidth:    maxWidth,
            maxHeight:   maxHeight
        };
    },
    
    /**
     * @private Creates single Legend Item
     */
    createLegendItem: function(series, yFieldIndex) {
        var me = this;
        
        return new Ext.chart.LegendItem({
            legend: me,
            series: series,
            surface: me.chart.surface,
            yFieldIndex: yFieldIndex
        });
    },
    
    /**
     * @private Get the bounds for the legend's outer box
     */
    getBBox: function() {
        var me = this;
        return {
            x: Math.round(me.x) - me.boxStrokeWidth / 2,
            y: Math.round(me.y) - me.boxStrokeWidth / 2,
            width: me.width + me.boxStrokeWidth,
            height: me.height + me.boxStrokeWidth
        };
    },

    /**
     * @private Create the box around the legend items
     */
    createBox: function() {
        var me = this,
            box, bbox;

        if (me.boxSprite) {
            me.boxSprite.destroy();
        }

        bbox = me.getBBox();
        //if some of the dimensions are NaN this means that we
        //cannot set a specific width/height for the legend
        //container. One possibility for this is that there are
        //actually no items to show in the legend, and the legend
        //should be hidden.
        if (isNaN(bbox.width) || isNaN(bbox.height)) {
            me.boxSprite = false;
            return;
        }
        
        box = me.boxSprite = me.chart.surface.add(Ext.apply({
            type: 'rect',
            stroke: me.boxStroke,
            "stroke-width": me.boxStrokeWidth,
            fill: me.boxFill,
            zIndex: me.boxZIndex
        }, bbox));

        box.redraw();
    },

    /**
     * @private Calculates Legend position with respect to other Chart elements.
     */
    calcPosition: function() {
        var me = this,
            x, y,
            legendWidth = me.width,
            legendHeight = me.height,
            chart = me.chart,
            chartBBox = chart.chartBBox,
            insets = chart.insetPadding,
            chartWidth = chartBBox.width - (insets * 2),
            chartHeight = chartBBox.height - (insets * 2),
            chartX = chartBBox.x + insets,
            chartY = chartBBox.y + insets,
            surface = chart.surface,
            mfloor = Math.floor;

        // Find the position based on the dimensions
        switch(me.position) {
            case "left":
                x = insets;
                y = mfloor(chartY + chartHeight / 2 - legendHeight / 2);
                break;
            case "right":
                x = mfloor(surface.width - legendWidth) - insets;
                y = mfloor(chartY + chartHeight / 2 - legendHeight / 2);
                break;
            case "top":
                x = mfloor(chartX + chartWidth / 2 - legendWidth / 2);
                y = insets;
                break;
            case "bottom":
                x = mfloor(chartX + chartWidth / 2 - legendWidth / 2);
                y = mfloor(surface.height - legendHeight) - insets;
                break;
            default:
                x = mfloor(me.origX) + insets;
                y = mfloor(me.origY) + insets;
        }
        
        return { x: x, y: y };
    },
    
    /**
     * @private Update the position of all the legend's sprites to match its current x/y values
     */
    updatePosition: function() {
        var me = this,
            items = me.items,
            pos, i, l, bbox;

        if (me.isDisplayed()) {
            // Find the position based on the dimensions
            pos = me.calcPosition();
            
            me.x = pos.x;
            me.y = pos.y;

            // Update the position of each item
            for (i = 0, l = items.length; i < l; i++) {
                items[i].updatePosition();
            }

            bbox = me.getBBox();

            //if some of the dimensions are NaN this means that we
            //cannot set a specific width/height for the legend
            //container. One possibility for this is that there are
            //actually no items to show in the legend, and the legend
            //should be hidden.
            if (isNaN(bbox.width) || isNaN(bbox.height)) {
                if (me.boxSprite) {
                    me.boxSprite.hide(true);
                }
            }
            else {
                if (!me.boxSprite) {
                    me.createBox();
                }
                
                // Update the position of the outer box
                me.boxSprite.setAttributes(bbox, true);
                me.boxSprite.show(true);
            }
        }
    },
    
    /** toggle
     * @param {Boolean} show Whether to show or hide the legend.
     *
     */
    toggle: function(show) {
      var me = this,
          i = 0,
          items = me.items,
          len = items.length;

      if (me.boxSprite) {
          if (show) {
              me.boxSprite.show(true);
          } else {
              me.boxSprite.hide(true);
          }
      }

      for (; i < len; ++i) {
          if (show) {
            items[i].show(true);
          } else {
              items[i].hide(true);
          }
      }

      me.visible = show;
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
 * Provides default colors for non-specified things. Should be sub-classed when creating new themes.
 * @private
 */
Ext.define('Ext.chart.theme.Base', {

    /* Begin Definitions */

                                        

    /* End Definitions */

    constructor: function(config) {
        var ident = Ext.identityFn;
        Ext.chart.theme.call(this, config, {
            background: false,
            axis: {
                stroke: '#444',
                'stroke-width': 1
            },
            axisLabelTop: {
                fill: '#444',
                font: '12px Arial, Helvetica, sans-serif',
                spacing: 2,
                padding: 5,
                renderer: ident
            },
            axisLabelRight: {
                fill: '#444',
                font: '12px Arial, Helvetica, sans-serif',
                spacing: 2,
                padding: 5,
                renderer: ident
            },
            axisLabelBottom: {
                fill: '#444',
                font: '12px Arial, Helvetica, sans-serif',
                spacing: 2,
                padding: 5,
                renderer: ident
            },
            axisLabelLeft: {
                fill: '#444',
                font: '12px Arial, Helvetica, sans-serif',
                spacing: 2,
                padding: 5,
                renderer: ident
            },
            axisTitleTop: {
                font: 'bold 18px Arial',
                fill: '#444'
            },
            axisTitleRight: {
                font: 'bold 18px Arial',
                fill: '#444',
                rotate: {
                    x:0, y:0,
                    degrees: 270
                }
            },
            axisTitleBottom: {
                font: 'bold 18px Arial',
                fill: '#444'
            },
            axisTitleLeft: {
                font: 'bold 18px Arial',
                fill: '#444',
                rotate: {
                    x:0, y:0,
                    degrees: 270
                }
            },
            series: {
                'stroke-width': 0
            },
            seriesLabel: {
                font: '12px Arial',
                fill: '#333'
            },
            marker: {
                stroke: '#555',
                radius: 3,
                size: 3
            },
            colors: [ "#94ae0a", "#115fa6","#a61120", "#ff8809", "#ffd13e", "#a61187", "#24ad9a", "#7c7474", "#a66111"],
            seriesThemes: [{
                fill: "#115fa6"
            }, {
                fill: "#94ae0a"
            }, {
                fill: "#a61120"
            }, {
                fill: "#ff8809"
            }, {
                fill: "#ffd13e"
            }, {
                fill: "#a61187"
            }, {
                fill: "#24ad9a"
            }, {
                fill: "#7c7474"
            }, {
                fill: "#115fa6"
            }, {
                fill: "#94ae0a"
            }, {
                fill: "#a61120"
            }, {
                fill: "#ff8809"
            }, {
                fill: "#ffd13e"
            }, {
                fill: "#a61187"
            }, {
                fill: "#24ad9a"
            }, {
                fill: "#7c7474"
            }, {
                fill: "#a66111"
            }],
            markerThemes: [{
                fill: "#115fa6",
                type: 'circle' 
            }, {
                fill: "#94ae0a",
                type: 'cross'
            }, {
                fill: "#115fa6",
                type: 'plus' 
            }, {
                fill: "#94ae0a",
                type: 'circle'
            }, {
                fill: "#a61120",
                type: 'cross'
            }]
        });
    }
}, function() {
    var palette = ['#b1da5a', '#4ce0e7', '#e84b67', '#da5abd', '#4d7fe6', '#fec935'],
        names = ['Green', 'Sky', 'Red', 'Purple', 'Blue', 'Yellow'],
        i = 0, j = 0, l = palette.length, themes = Ext.chart.theme,
        categories = [['#f0a50a', '#c20024', '#2044ba', '#810065', '#7eae29'],
                      ['#6d9824', '#87146e', '#2a9196', '#d39006', '#1e40ac'],
                      ['#fbbc29', '#ce2e4e', '#7e0062', '#158b90', '#57880e'],
                      ['#ef5773', '#fcbd2a', '#4f770d', '#1d3eaa', '#9b001f'],
                      ['#7eae29', '#fdbe2a', '#910019', '#27b4bc', '#d74dbc'],
                      ['#44dce1', '#0b2592', '#996e05', '#7fb325', '#b821a1']],
        cats = categories.length;
    
    //Create themes from base colors
    for (; i < l; i++) {
        themes[names[i]] = (function(color) {
            return Ext.extend(themes.Base, {
                constructor: function(config) {
                    themes.Base.prototype.constructor.call(this, Ext.apply({
                        baseColor: color
                    }, config));
                }
            });
        }(palette[i]));
    }
    
    //Create theme from color array
    for (i = 0; i < cats; i++) {
        themes['Category' + (i + 1)] = (function(category) {
            return Ext.extend(themes.Base, {
                constructor: function(config) {
                    themes.Base.prototype.constructor.call(this, Ext.apply({
                        colors: category
                    }, config));
                }
            });
        }(categories[i]));
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
 * Charts provide a flexible way to achieve a wide range of data visualization capablitities.
 * Each Chart gets its data directly from a {@link Ext.data.Store Store}, and automatically
 * updates its display whenever data in the Store changes. In addition, the look and feel
 * of a Chart can be customized using {@link Ext.chart.theme.Theme Theme}s.
 * 
 * ## Creating a Simple Chart
 * 
 * Every Chart has three key parts - a {@link Ext.data.Store Store} that contains the data,
 * an array of {@link Ext.chart.axis.Axis Axes} which define the boundaries of the Chart,
 * and one or more {@link Ext.chart.series.Series Series} to handle the visual rendering of the data points.
 * 
 * ### 1. Creating a Store
 * 
 * The first step is to create a {@link Ext.data.Model Model} that represents the type of
 * data that will be displayed in the Chart. For example the data for a chart that displays
 * a weather forecast could be represented as a series of "WeatherPoint" data points with
 * two fields - "temperature", and "date":
 * 
 *     Ext.define('WeatherPoint', {
 *         extend: 'Ext.data.Model',
 *         fields: ['temperature', 'date']
 *     });
 * 
 * Next a {@link Ext.data.Store Store} must be created.  The store contains a collection of "WeatherPoint" Model instances.
 * The data could be loaded dynamically, but for sake of ease this example uses inline data:
 * 
 *     var store = Ext.create('Ext.data.Store', {
 *         model: 'WeatherPoint',
 *         data: [
 *             { temperature: 58, date: new Date(2011, 1, 1, 8) },
 *             { temperature: 63, date: new Date(2011, 1, 1, 9) },
 *             { temperature: 73, date: new Date(2011, 1, 1, 10) },
 *             { temperature: 78, date: new Date(2011, 1, 1, 11) },
 *             { temperature: 81, date: new Date(2011, 1, 1, 12) }
 *         ]
 *     });
 *    
 * For additional information on Models and Stores please refer to the [Data Guide](#/guide/data).
 * 
 * ### 2. Creating the Chart object
 * 
 * Now that a Store has been created it can be used in a Chart:
 * 
 *     Ext.create('Ext.chart.Chart', {
 *        renderTo: Ext.getBody(),
 *        width: 400,
 *        height: 300,
 *        store: store
 *     });
 *    
 * That's all it takes to create a Chart instance that is backed by a Store.
 * However, if the above code is run in a browser, a blank screen will be displayed.
 * This is because the two pieces that are responsible for the visual display,
 * the Chart's {@link #cfg-axes axes} and {@link #cfg-series series}, have not yet been defined.
 * 
 * ### 3. Configuring the Axes
 * 
 * {@link Ext.chart.axis.Axis Axes} are the lines that define the boundaries of the data points that a Chart can display.
 * This example uses one of the most common Axes configurations - a horizontal "x" axis, and a vertical "y" axis:
 * 
 *     Ext.create('Ext.chart.Chart', {
 *         ...
 *         axes: [
 *             {
 *                 title: 'Temperature',
 *                 type: 'Numeric',
 *                 position: 'left',
 *                 fields: ['temperature'],
 *                 minimum: 0,
 *                 maximum: 100
 *             },
 *             {
 *                 title: 'Time',
 *                 type: 'Time',
 *                 position: 'bottom',
 *                 fields: ['date'],
 *                 dateFormat: 'ga'
 *             }
 *         ]
 *     });
 *    
 * The "Temperature" axis is a vertical {@link Ext.chart.axis.Numeric Numeric Axis} and is positioned on the left edge of the Chart.
 * It represents the bounds of the data contained in the "WeatherPoint" Model's "temperature" field that was
 * defined above. The minimum value for this axis is "0", and the maximum is "100".
 * 
 * The horizontal axis is a {@link Ext.chart.axis.Time Time Axis} and is positioned on the bottom edge of the Chart.
 * It represents the bounds of the data contained in the "WeatherPoint" Model's "date" field.
 * The {@link Ext.chart.axis.Time#cfg-dateFormat dateFormat}
 * configuration tells the Time Axis how to format it's labels.
 * 
 * Here's what the Chart looks like now that it has its Axes configured:
 * 
 * {@img Ext.chart.Chart/Ext.chart.Chart1.png Chart Axes}
 * 
 * ### 4. Configuring the Series
 * 
 * The final step in creating a simple Chart is to configure one or more {@link Ext.chart.series.Series Series}.
 * Series are responsible for the visual representation of the data points contained in the Store.
 * This example only has one Series:
 * 
 *     Ext.create('Ext.chart.Chart', {
 *         ...
 *         axes: [
 *             ...
 *         ],
 *         series: [
 *             {
 *                 type: 'line',
 *                 xField: 'date',
 *                 yField: 'temperature'
 *             }
 *         ]
 *     });
 *     
 * This Series is a {@link Ext.chart.series.Line Line Series}, and it uses the "date" and "temperature" fields
 * from the "WeatherPoint" Models in the Store to plot its data points:
 * 
 * {@img Ext.chart.Chart/Ext.chart.Chart2.png Line Series}
 * 
 * See the [Line Charts Example](#!/example/charts/Charts.html) for a live demo.
 * 
 * ## Themes
 * 
 * The color scheme for a Chart can be easily changed using the {@link #cfg-theme theme} configuration option:
 * 
 *     Ext.create('Ext.chart.Chart', {
 *         ...
 *         theme: 'Green',
 *         ...
 *     });
 * 
 * {@img Ext.chart.Chart/Ext.chart.Chart3.png Green Theme}
 * 
 * For more information on Charts please refer to the [Charting Guide](#/guide/charting).
 */
Ext.define('Ext.chart.Chart', {
    extend:  Ext.draw.Component ,

    alias: 'widget.chart',
    
    mixins: {
        themeManager:  Ext.chart.theme.Theme ,
        mask:  Ext.chart.Mask ,
        navigation:  Ext.chart.Navigation ,
        bindable:  Ext.util.Bindable ,
        observable:  Ext.util.Observable 
    },

           
                                 
      
    
               
                                   
                                
                           
                               
                                
                              
      

    /* End Definitions */

    // @private
    viewBox: false,

    /**
     * @cfg {String} theme
     * The name of the theme to be used. A theme defines the colors and other visual displays of tick marks
     * on axis, text, title text, line colors, marker colors and styles, etc. Possible theme values are 'Base', 'Green',
     * 'Sky', 'Red', 'Purple', 'Blue', 'Yellow' and also six category themes 'Category1' to 'Category6'. Default value
     * is 'Base'.
     */

    /**
     * @cfg {Boolean/Object} animate
     * True for the default animation (easing: 'ease' and duration: 500) or a standard animation config
     * object to be used for default chart animations. Defaults to false.
     */
    animate: false,

    /**
     * @cfg {Boolean/Object} legend
     * True for the default legend display or a legend config object. Defaults to false.
     */
    legend: false,

    /**
     * @cfg {Number} insetPadding
     * The amount of inset padding in pixels for the chart. Defaults to 10.
     */
    insetPadding: 10,

    /**
     * @cfg {Object/Boolean} background
     * The chart background. This can be a gradient object, image, or color. Defaults to false for no
     * background. For example, if `background` were to be a color we could set the object as
     *
     *     background: {
     *         //color string
     *         fill: '#ccc'
     *     }
     *
     * You can specify an image by using:
     *
     *     background: {
     *         image: 'http://path.to.image/'
     *     }
     *
     * Also you can specify a gradient by using the gradient object syntax:
     *
     *     background: {
     *         gradient: {
     *             id: 'gradientId',
     *             angle: 45,
     *             stops: {
     *                 0: {
     *                     color: '#555'
     *                 }
     *                 100: {
     *                     color: '#ddd'
     *                 }
     *             }
     *         }
     *     }
     */
    background: false,

    /**
     * @cfg {Object[]} gradients
     * Define a set of gradients that can be used as `fill` property in sprites. The gradients array is an
     * array of objects with the following properties:
     *
     * - **id** - string - The unique name of the gradient.
     * - **angle** - number, optional - The angle of the gradient in degrees.
     * - **stops** - object - An object with numbers as keys (from 0 to 100) and style objects as values
     *
     * For example:
     *
     *     gradients: [{
     *         id: 'gradientId',
     *         angle: 45,
     *         stops: {
     *             0: {
     *                 color: '#555'
     *             },
     *             100: {
     *                 color: '#ddd'
     *             }
     *         }
     *     }, {
     *         id: 'gradientId2',
     *         angle: 0,
     *         stops: {
     *             0: {
     *                 color: '#590'
     *             },
     *             20: {
     *                 color: '#599'
     *             },
     *             100: {
     *                 color: '#ddd'
     *             }
     *         }
     *     }]
     *
     * Then the sprites can use `gradientId` and `gradientId2` by setting the fill attributes to those ids, for example:
     *
     *     sprite.setAttributes({
     *         fill: 'url(#gradientId)'
     *     }, true);
     */

    /**
     * @cfg {Ext.data.Store} store
     * The store that supplies data to this chart.
     */

    /**
     * @cfg {Ext.chart.series.Series[]} series
     * Array of {@link Ext.chart.series.Series Series} instances or config objects.  For example:
     * 
     *     series: [{
     *         type: 'column',
     *         axis: 'left',
     *         listeners: {
     *             'afterrender': function() {
     *                 console('afterrender');
     *             }
     *         },
     *         xField: 'category',
     *         yField: 'data1'
     *     }]
     */

    /**
     * @cfg {Ext.chart.axis.Axis[]} axes
     * Array of {@link Ext.chart.axis.Axis Axis} instances or config objects.  For example:
     * 
     *     axes: [{
     *         type: 'Numeric',
     *         position: 'left',
     *         fields: ['data1'],
     *         title: 'Number of Hits',
     *         minimum: 0,
     *         //one minor tick between two major ticks
     *         minorTickSteps: 1
     *     }, {
     *         type: 'Category',
     *         position: 'bottom',
     *         fields: ['name'],
     *         title: 'Month of the Year'
     *     }]
     */

    constructor: function(config) {
        var me = this,
            defaultAnim;

        config = Ext.apply({}, config);
        me.initTheme(config.theme || me.theme);
        if (me.gradients) {
            Ext.apply(config, { gradients: me.gradients });
        }
        if (me.background) {
            Ext.apply(config, { background: me.background });
        }
        if (config.animate) {
            defaultAnim = {
                easing: 'ease',
                duration: 500
            };
            if (Ext.isObject(config.animate)) {
                config.animate = Ext.applyIf(config.animate, defaultAnim);
            }
            else {
                config.animate = defaultAnim;
            }
        }

        me.mixins.observable.constructor.call(me, config);
        if (config.enableMask) {
            me.mixins.mask.constructor.call(me);
        }
        me.mixins.navigation.constructor.call(me);
        me.callParent([config]);
    },
    
    getChartStore: function(){
        return this.substore || this.store;
    },

    initComponent: function() {
        var me = this,
            axes,
            series;
        me.callParent();
        me.addEvents(
            'itemmousedown',
            'itemmouseup',
            'itemmouseover',
            'itemmouseout',
            'itemclick',
            'itemdblclick',
            'itemdragstart',
            'itemdrag',
            'itemdragend',
            /**
             * @event beforerefresh
             * Fires before a refresh to the chart data is called. If the beforerefresh handler returns false the
             * {@link #event-refresh} action will be cancelled.
             * @param {Ext.chart.Chart} this
             */
            'beforerefresh',
            /**
             * @event refresh
             * Fires after the chart data has been refreshed.
             * @param {Ext.chart.Chart} this
             */
            'refresh'
        );
        Ext.applyIf(me, {
            zoom: {
                width: 1,
                height: 1,
                x: 0,
                y: 0
            }
        });
        me.maxGutters = { left: 0, right: 0, bottom: 0, top: 0 };
        me.store = Ext.data.StoreManager.lookup(me.store);
        axes = me.axes;
        me.axes = new Ext.util.MixedCollection(false, function(a) { return a.position; });
        if (axes) {
            me.axes.addAll(axes);
        }
        series = me.series;
        me.series = new Ext.util.MixedCollection(false, function(a) { return a.seriesId || (a.seriesId = Ext.id(null, 'ext-chart-series-')); });
        if (series) {
            me.series.addAll(series);
        }
        if (me.legend !== false) {
            me.legend = new Ext.chart.Legend(Ext.applyIf({chart:me}, me.legend));
        }

        me.on({
            mousemove: me.onMouseMove,
            mouseleave: me.onMouseLeave,
            mousedown: me.onMouseDown,
            mouseup: me.onMouseUp,
            click: me.onClick,
            dblclick: me.onDblClick,
            scope: me
        });
    },

    // @private overrides the component method to set the correct dimensions to the chart.
    afterComponentLayout: function(width, height, oldWidth, oldHeight) {
        var me = this;
        if (Ext.isNumber(width) && Ext.isNumber(height)) {
            if (width !== oldWidth || height !== oldHeight) {
                me.curWidth = width;
                me.curHeight = height;
                me.redraw(true);
                me.needsRedraw = false;
            } else if (me.needsRedraw) {
                me.redraw();
                me.needsRedraw = false;
            }
        }
        this.callParent(arguments);
    },

    /**
     * Redraws the chart. If animations are set this will animate the chart too. 
     * @param {Boolean} resize (optional) flag which changes the default origin points of the chart for animations.
     */
    redraw: function(resize) {
        var me = this,
            seriesItems = me.series.items,
            seriesLen = seriesItems.length,
            axesItems = me.axes.items,
            axesLen = axesItems.length,
            themeIndex = 0,
            i, item,
            chartBBox = me.chartBBox = {
                x: 0,
                y: 0,
                height: me.curHeight,
                width: me.curWidth
            },
            legend = me.legend, 
            series;
            
        me.surface.setSize(chartBBox.width, chartBBox.height);
        // Instantiate Series and Axes
        for (i = 0; i < seriesLen; i++) {
            item = seriesItems[i];
            if (!item.initialized) {
                series = me.initializeSeries(item, i, themeIndex);
            } else {
                series = item;
            }
            // Allow the series to react to a redraw, for example, a pie series
            // backed by a remote data set needs to build legend labels correctly
            series.onRedraw();
            // For things like stacked bar charts, a single series can consume
            // multiple colors from the index, so we compensate for it here
            if (Ext.isArray(item.yField)) {
                themeIndex += item.yField.length;
            } else {
                ++themeIndex;
            }
        }
        for (i = 0; i < axesLen; i++) {
            item = axesItems[i];
            if (!item.initialized) {
                me.initializeAxis(item);
            }
        }
        //process all views (aggregated data etc) on stores
        //before rendering.
        for (i = 0; i < axesLen; i++) {
            axesItems[i].processView();
        }
        for (i = 0; i < axesLen; i++) {
            axesItems[i].drawAxis(true);
        }

        // Create legend if not already created
        if (legend !== false && legend.visible) {
            if (legend.update || !legend.created) {
                legend.create();
            }
        }

        // Place axes properly, including influence from each other
        me.alignAxes();

        // Reposition legend based on new axis alignment
        if (legend !== false && legend.visible) {
            legend.updatePosition();
        }

        // Find the max gutters
        me.getMaxGutters();

        // Draw axes and series
        me.resizing = !!resize;

        for (i = 0; i < axesLen; i++) {
            axesItems[i].drawAxis();
        }
        for (i = 0; i < seriesLen; i++) {
            me.drawCharts(seriesItems[i]);
        }
        me.resizing = false;
    },

    // @private set the store after rendering the chart.
    afterRender: function() {
        var me = this;
        
        me.callParent(arguments);

        if (me.categoryNames) {
            me.setCategoryNames(me.categoryNames);
        }

        me.bindStore(me.store, true);
        me.refresh();

        if (me.surface.engine === 'Vml') {
            me.on('added', me.onAddedVml, me);
            me.mon(me.hierarchyEventSource, 'added', me.onContainerAddedVml, me);
        }
    },

    // When using a vml surface we need to redraw when this chart or one of its ancestors
    // is moved to a new container after render, because moving the vml chart causes the
    // vml elements to go haywire, some displaing incorrectly or not displaying at all.
    // This appears to be caused by the component being moved to the detached body element
    // before being added to the new container.
    onAddedVml: function() {
        this.needsRedraw = true; // redraw after component layout
    },

    onContainerAddedVml: function(container) {
        if (this.isDescendantOf(container)) {
            this.needsRedraw = true; // redraw after component layout
        }
    },

    // @private get x and y position of the mouse cursor.
    getEventXY: function(e) {
        var me = this,
            box = this.surface.getRegion(),
            pageXY = e.getXY(),
            x = pageXY[0] - box.left,
            y = pageXY[1] - box.top;
        return [x, y];
    },
    
    onClick: function(e) {
        this.handleClick('itemclick', e);
    },
    
    onDblClick: function(e) {
        this.handleClick('itemdblclick', e);
    },

    // @private wrap the mouse down position to delegate the event to the series.
    handleClick: function(name, e) {
        var me = this,
            position = me.getEventXY(e),
            seriesItems = me.series.items,
            i, ln, series,
            item;

        // Ask each series if it has an item corresponding to (not necessarily exactly
        // on top of) the current mouse coords. Fire itemclick event.
        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            if (Ext.draw.Draw.withinBox(position[0], position[1], series.bbox)) {
                if (series.getItemForPoint) {
                    item = series.getItemForPoint(position[0], position[1]);
                    if (item) {
                        series.fireEvent(name, item);
                    }
                }
            }
        }
    },

    // @private wrap the mouse down position to delegate the event to the series.
    onMouseDown: function(e) {
        var me = this,
            position = me.getEventXY(e),
            seriesItems = me.series.items,
            i, ln, series,
            item;

        if (me.enableMask) {
            me.mixins.mask.onMouseDown.call(me, e);
        }
        // Ask each series if it has an item corresponding to (not necessarily exactly
        // on top of) the current mouse coords. Fire itemmousedown event.
        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            if (Ext.draw.Draw.withinBox(position[0], position[1], series.bbox)) {
                if (series.getItemForPoint) {
                    item = series.getItemForPoint(position[0], position[1]);
                    if (item) {
                        series.fireEvent('itemmousedown', item);
                    }
                }
            }
        }
    },

    // @private wrap the mouse up event to delegate it to the series.
    onMouseUp: function(e) {
        var me = this,
            position = me.getEventXY(e),
            seriesItems = me.series.items,
            i, ln, series,
            item;

        if (me.enableMask) {
            me.mixins.mask.onMouseUp.call(me, e);
        }
        // Ask each series if it has an item corresponding to (not necessarily exactly
        // on top of) the current mouse coords. Fire itemmouseup event.
        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            if (Ext.draw.Draw.withinBox(position[0], position[1], series.bbox)) {
                if (series.getItemForPoint) {
                    item = series.getItemForPoint(position[0], position[1]);
                    if (item) {
                        series.fireEvent('itemmouseup', item);
                    }
                }
            }
        }
    },

    // @private wrap the mouse move event so it can be delegated to the series.
    onMouseMove: function(e) {
        var me = this,
            position = me.getEventXY(e),
            seriesItems = me.series.items,
            i, ln, series,
            item, last, storeItem, storeField;

        
        if (me.enableMask) {
            me.mixins.mask.onMouseMove.call(me, e);
        }
        // Ask each series if it has an item corresponding to (not necessarily exactly
        // on top of) the current mouse coords. Fire itemmouseover/out events.
        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            if (Ext.draw.Draw.withinBox(position[0], position[1], series.bbox)) {
                if (series.getItemForPoint) {
                    item = series.getItemForPoint(position[0], position[1]);
                    last = series._lastItemForPoint;
                    storeItem = series._lastStoreItem;
                    storeField = series._lastStoreField;


                    if (item !== last || item && (item.storeItem != storeItem || item.storeField != storeField)) {
                        if (last) {
                            series.fireEvent('itemmouseout', last);
                            delete series._lastItemForPoint;
                            delete series._lastStoreField;
                            delete series._lastStoreItem;
                        }
                        if (item) {
                            series.fireEvent('itemmouseover', item);
                            series._lastItemForPoint = item;
                            series._lastStoreItem = item.storeItem;
                            series._lastStoreField = item.storeField;
                        }
                    }
                }
            } else {
                last = series._lastItemForPoint;
                if (last) {
                    series.fireEvent('itemmouseout', last);
                    delete series._lastItemForPoint;
                    delete series._lastStoreField;
                    delete series._lastStoreItem;
                }
            }
        }
    },

    // @private handle mouse leave event.
    onMouseLeave: function(e) {
        var me = this,
            seriesItems = me.series.items,
            i, ln, series;

        if (me.enableMask) {
            me.mixins.mask.onMouseLeave.call(me, e);
        }
        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            delete series._lastItemForPoint;
        }
    },

    // @private buffered refresh for when we update the store
    delayRefresh: function() {
        var me = this;
        if (!me.refreshTask) {
            me.refreshTask = new Ext.util.DelayedTask(me.refresh, me);
        }
        me.refreshTask.delay(me.refreshBuffer);
    },

    // @private
    refresh: function() {
        var me = this;
            
        if (me.rendered && me.curWidth !== undefined && me.curHeight !== undefined) {
            if (!me.isVisible(true)) {
                if (!me.refreshPending) {
                    me.setShowListeners('mon');
                    me.refreshPending = true;
                }
                return;
            }
            if (me.fireEvent('beforerefresh', me) !== false) {
                me.redraw();
                me.fireEvent('refresh', me);
            }
        }
    },
    
    onShow: function(){
        var me = this;
        me.callParent(arguments);
        if (me.refreshPending) {
            me.delayRefresh();
            me.setShowListeners('mun');
        }
        delete me.refreshPending;
    },
    
    setShowListeners: function(method){
        var me = this;
        me[method](me.hierarchyEventSource, {
            scope: me,
            single: true,
            show: me.forceRefresh,
            expand: me.forceRefresh
        });
    },
    
    doRefresh: function(){
        // Data in the main store has changed, clear the sub store
        this.setSubStore(null);
        this.refresh();    
    },
    
    forceRefresh: function(container) {
        var me = this;
        if (me.isDescendantOf(container) && me.refreshPending) {
            // Add unbind here, because either expand/show could be fired,
            // so be sure to unbind the listener that didn't
            me.setShowListeners('mun');
            me.delayRefresh();
        }    
        delete me.refreshPending;
    },

    bindStore: function(store, initial) {
        var me = this;
        me.mixins.bindable.bindStore.apply(me, arguments);
        if (me.store && !initial) {
            me.refresh();
        }
    },
    
    getStoreListeners: function() {
        var refresh = this.doRefresh,
            delayRefresh = this.delayRefresh;
            
        return {
            refresh: refresh,
            add: delayRefresh,
            bulkremove: delayRefresh,
            update: delayRefresh,
            clear: refresh
        };
    },
    
    setSubStore: function(subStore){
        this.substore = subStore;    
    },

    // @private Create Axis
    initializeAxis: function(axis) {
        var me = this,
            chartBBox = me.chartBBox,
            w = chartBBox.width,
            h = chartBBox.height,
            x = chartBBox.x,
            y = chartBBox.y,
            themeAttrs = me.themeAttrs,
            config = {
                chart: me
            };
        if (themeAttrs) {
            config.axisStyle = Ext.apply({}, themeAttrs.axis);
            config.axisLabelLeftStyle = Ext.apply({}, themeAttrs.axisLabelLeft);
            config.axisLabelRightStyle = Ext.apply({}, themeAttrs.axisLabelRight);
            config.axisLabelTopStyle = Ext.apply({}, themeAttrs.axisLabelTop);
            config.axisLabelBottomStyle = Ext.apply({}, themeAttrs.axisLabelBottom);
            config.axisTitleLeftStyle = Ext.apply({}, themeAttrs.axisTitleLeft);
            config.axisTitleRightStyle = Ext.apply({}, themeAttrs.axisTitleRight);
            config.axisTitleTopStyle = Ext.apply({}, themeAttrs.axisTitleTop);
            config.axisTitleBottomStyle = Ext.apply({}, themeAttrs.axisTitleBottom);
        }
        switch (axis.position) {
            case 'top':
                Ext.apply(config, {
                    length: w,
                    width: h,
                    x: x,
                    y: y
                });
            break;
            case 'bottom':
                Ext.apply(config, {
                    length: w,
                    width: h,
                    x: x,
                    y: h
                });
            break;
            case 'left':
                Ext.apply(config, {
                    length: h,
                    width: w,
                    x: x,
                    y: h
                });
            break;
            case 'right':
                Ext.apply(config, {
                    length: h,
                    width: w,
                    x: w,
                    y: h
                });
            break;
        }
        if (!axis.chart) {
            Ext.apply(config, axis);
            axis = me.axes.replace(Ext.createByAlias('axis.' + axis.type.toLowerCase(), config));
        } else {
            Ext.apply(axis, config);
        }
        axis.initialized = true;
    },


    /**
     * @private Get initial insets; override to provide different defaults.
     */
    getInsets: function() {
        var me = this,
            insetPadding = me.insetPadding;

        return {
            top: insetPadding,
            right: insetPadding,
            bottom: insetPadding,
            left: insetPadding
        };
    },

    /**
     * @private Calculate insets for the Chart.
     */
    calculateInsets: function() {
        var me = this,
            legend = me.legend,
            axes = me.axes,
            edges = ['top', 'right', 'bottom', 'left'],
            insets, i, l, edge, isVertical, axis, bbox;

        function getAxis(edge) {
            var i = axes.findIndex('position', edge);
            return (i < 0) ? null : axes.getAt(i);
        }
        
        insets = me.getInsets();

        // Find the space needed by axes and legend as a positive inset from each edge
        for (i = 0, l = edges.length; i < l; i++) {
            edge = edges[i];
            
            isVertical = (edge === 'left' || edge === 'right');
            axis = getAxis(edge);

            // Add legend size if it's on this edge
            if (legend !== false) {
                if (legend.position === edge) {
                    bbox = legend.getBBox();
                    insets[edge] += (isVertical ? bbox.width : bbox.height) + me.insetPadding;
                }
            }

            // Add axis size if there's one on this edge only if it has been
            //drawn before.
            if (axis && axis.bbox) {
                bbox = axis.bbox;
                insets[edge] += (isVertical ? bbox.width : bbox.height);
            }
        };
        
        return insets;
    },

    /**
     * @private Adjust the dimensions and positions of each axis and the chart body area after accounting
     * for the space taken up on each side by the axes and legend.
     * This code is taken from Ext.chart.Chart and refactored to provide better flexibility.
     */
    alignAxes: function() {
        var me = this,
            axesItems = me.axes.items,
            insets, chartBBox, i, l, axis, pos, isVertical;
        
        insets = me.calculateInsets();

        // Build the chart bbox based on the collected inset values
        chartBBox = {
            x: insets.left,
            y: insets.top,
            width: me.curWidth - insets.left - insets.right,
            height: me.curHeight - insets.top - insets.bottom
        };
        me.chartBBox = chartBBox;

        // Go back through each axis and set its length and position based on the
        // corresponding edge of the chartBBox
        for (i = 0, l = axesItems.length; i < l; i++) {
            axis = axesItems[i];
            pos = axis.position;
            isVertical = pos === 'left' || pos === 'right';

            axis.x = (pos === 'right' ? chartBBox.x + chartBBox.width : chartBBox.x);
            axis.y = (pos === 'top' ? chartBBox.y : chartBBox.y + chartBBox.height);
            axis.width = (isVertical ? chartBBox.width : chartBBox.height);
            axis.length = (isVertical ? chartBBox.height : chartBBox.width);
        };
    },

    // @private initialize the series.
    initializeSeries: function(series, idx, themeIndex) {
        var me = this,
            themeAttrs = me.themeAttrs,
            seriesObj, markerObj, seriesThemes, st,
            markerThemes, colorArrayStyle = [],
            isInstance = (series instanceof Ext.chart.series.Series).
            i = 0, l, config;

        if (!series.initialized) {
            config = {
                chart: me,
                seriesId: series.seriesId
            };
            if (themeAttrs) {
                seriesThemes = themeAttrs.seriesThemes;
                markerThemes = themeAttrs.markerThemes;
                seriesObj = Ext.apply({}, themeAttrs.series);
                markerObj = Ext.apply({}, themeAttrs.marker);
                config.seriesStyle = Ext.apply(seriesObj, seriesThemes[themeIndex % seriesThemes.length]);
                config.seriesLabelStyle = Ext.apply({}, themeAttrs.seriesLabel);
                config.markerStyle = Ext.apply(markerObj, markerThemes[themeIndex % markerThemes.length]);
                if (themeAttrs.colors) {
                    config.colorArrayStyle = themeAttrs.colors;
                } else {
                    colorArrayStyle = [];
                    for (l = seriesThemes.length; i < l; i++) {
                        st = seriesThemes[i];
                        if (st.fill || st.stroke) {
                            colorArrayStyle.push(st.fill || st.stroke);
                        }
                    }
                    if (colorArrayStyle.length) {
                        config.colorArrayStyle = colorArrayStyle;
                    }
                }
                config.seriesIdx = idx;
                config.themeIdx = themeIndex;
            }
            
            if (isInstance) {
                Ext.applyIf(series, config);
            }
            else {
                Ext.applyIf(config, series);
                series = me.series.replace(Ext.createByAlias('series.' + series.type.toLowerCase(), config));
            }
        }

        if (series.initialize) {
            series.initialize();
        }
        series.initialized = true;
        return series;
    },

    // @private
    getMaxGutters: function() {
        var me = this,
            seriesItems = me.series.items,
            i, ln, series, gutters,
            lowerH = 0, upperH = 0, lowerV = 0, upperV = 0;

        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            gutters = seriesItems[i].getGutters();
            if (gutters) {
                if (gutters.verticalAxis) {
                    lowerV = Math.max(lowerV, gutters.lower);
                    upperV = Math.max(upperV, gutters.upper);
                }
                else {
                    lowerH = Math.max(lowerH, gutters.lower);
                    upperH = Math.max(upperH, gutters.upper);
                }
            }
        }
        me.maxGutters = {
            left: lowerH,
            right: upperH,
            bottom: lowerV,
            top: upperV
        };
    },

    // @private draw axis.
    drawAxis: function(axis) {
        axis.drawAxis();
    },

    // @private draw series.
    drawCharts: function(series) {
        series.triggerafterrender = false;
        series.drawSeries();
        if (!this.animate) {
            series.fireEvent('afterrender');
        }
    },
    /**
     * Saves the chart by either triggering a download or returning a string containing the chart data
     * as SVG.  The action depends on the export type specified in the passed configuration. The chart
     * will be exported using either the {@link Ext.draw.engine.SvgExporter} or the {@link Ext.draw.engine.ImageExporter}
     * classes.
     *
     * Possible export types:
     *
     * - 'image/png'
     * - 'image/jpeg',
     * - 'image/svg+xml'
     *
     * If 'image/svg+xml' is specified, the SvgExporter will be used. 
     * If 'image/png' or 'image/jpeg' are specified, the ImageExporter will be used. This exporter
     * must post the SVG data to a remote server to have the data processed, see the {@link Ext.draw.engine.ImageExporter}
     * for more details.
     *
     * Example usage:
     *
     *     chart.save({
     *          type: 'image/png'
     *     });
     *
     * **Important**: By default, chart data is sent to a server operated
     * by Sencha to do data processing. You may change this default by
     * setting the {@link Ext.draw.engine.ImageExporter#defaultUrl defaultUrl} of the {@link Ext.draw.engine.ImageExporter} class.
     * In addition, please note that this service only creates PNG images.
     *
     * @param {Object} [config] The configuration to be passed to the exporter.
     * See the export method for the appropriate exporter for the relevant
     * configuration options
     * @return {Object} See the return types for the appropriate exporter
     */
    save: function(config){
        return Ext.draw.Surface.save(this.surface, config);
    },
    // @private remove gently.
    destroy: function() {
        Ext.destroy(this.surface);
        this.bindStore(null);
        this.callParent(arguments);
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
 * @class Ext.chart.Highlight
 * A mixin providing highlight functionality for Ext.chart.series.Series.
 */
Ext.define('Ext.chart.Highlight', {

    /* Begin Definitions */

                              

    /* End Definitions */

    /**
     * @cfg {Boolean/Object} [highlight=false] Set to `true` to enable highlighting using the {@link #highlightCfg default highlight attributes}.
     * 
     * Can also be an object with style properties (i.e fill, stroke, stroke-width, radius) which are may override the {@link #highlightCfg default highlight attributes}.
     */
    highlight: false,

    /**
     * @property {Object} highlightCfg The default properties to apply as a highight. Value is
     *
     *    {
     *        fill: '#fdd',
     *        "stroke-width": 5,
     *        stroke: "#f55'
     *    }
     */
    highlightCfg : {
        fill: '#fdd',
        "stroke-width": 5,
        stroke: '#f55'
    },

    constructor: function(config) {
        // If configured with a highlight object, apply to to *a local copy of* this class's highlightCfg. Do not mutate the prototype's copy.
        if (config.highlight && (typeof config.highlight !== 'boolean')) { //is an object
            this.highlightCfg = Ext.merge({}, this.highlightCfg, config.highlight);
        }
    },

    /**
     * Highlight the given series item.
     * @param {Object} item Info about the item; same format as returned by #getItemForPoint.
     */
    highlightItem: function(item) {
        if (!item) {
            return;
        }
        
        var me = this,
            sprite = item.sprite,
            opts = Ext.merge({}, me.highlightCfg, me.highlight),
            surface = me.chart.surface,
            animate = me.chart.animate,
            p, from, to, pi;

        if (!me.highlight || !sprite || sprite._highlighted) {
            return;
        }
        if (sprite._anim) {
            sprite._anim.paused = true;
        }
        sprite._highlighted = true;
        if (!sprite._defaults) {
            sprite._defaults = Ext.apply({}, sprite.attr);
            from = {};
            to = {};
            // TODO: Clean up code below.
            for (p in opts) {
                if (! (p in sprite._defaults)) {
                    sprite._defaults[p] = surface.availableAttrs[p];
                }
                from[p] = sprite._defaults[p];
                to[p] = opts[p];
                if (Ext.isObject(opts[p])) {
                    from[p] = {};
                    to[p] = {};
                    Ext.apply(sprite._defaults[p], sprite.attr[p]);
                    Ext.apply(from[p], sprite._defaults[p]);
                    for (pi in sprite._defaults[p]) {
                        if (! (pi in opts[p])) {
                            to[p][pi] = from[p][pi];
                        } else {
                            to[p][pi] = opts[p][pi];
                        }
                    }
                    for (pi in opts[p]) {
                        if (! (pi in to[p])) {
                            to[p][pi] = opts[p][pi];
                        }
                    }
                }
            }
            sprite._from = from;
            sprite._to = to;
            sprite._endStyle = to;
        }
        if (animate) {
            sprite._anim = new Ext.fx.Anim({
                target: sprite,
                from: sprite._from,
                to: sprite._to,
                duration: 150
            });
        } else {
            sprite.setAttributes(sprite._to, true);
        }
    },

    /**
     * Un-highlight any existing highlights
     */
    unHighlightItem: function() {
        if (!this.highlight || !this.items) {
            return;
        }

        var me = this,
            items = me.items,
            len = items.length,
            opts = Ext.merge({}, me.highlightCfg, me.highlight),
            animate = me.chart.animate,
            i = 0,
            obj, p, sprite;
        for (; i < len; i++) {
            if (!items[i]) {
                continue;
            }
            sprite = items[i].sprite;
            if (sprite && sprite._highlighted) {
                if (sprite._anim) {
                    sprite._anim.paused = true;
                }
                obj = {};
                for (p in opts) {
                    if (Ext.isObject(sprite._defaults[p])) {
                        obj[p] = Ext.apply({}, sprite._defaults[p]);
                    }
                    else {
                        obj[p] = sprite._defaults[p];
                    }
                }
                if (animate) {
                    //sprite._to = obj;
                    sprite._endStyle = obj;
                    sprite._anim = new Ext.fx.Anim({
                        target: sprite,
                        to: obj,
                        duration: 150
                    });
                }
                else {
                    sprite.setAttributes(obj, true);
                }
                delete sprite._highlighted;
                //delete sprite._defaults;
            }
        }
    },

    cleanHighlights: function() {
        if (!this.highlight) {
            return;
        }

        var group = this.group,
            markerGroup = this.markerGroup,
            i = 0,
            l;
        for (l = group.getCount(); i < l; i++) {
            delete group.getAt(i)._defaults;
        }
        if (markerGroup) {
            for (l = markerGroup.getCount(); i < l; i++) {
                delete markerGroup.getAt(i)._defaults;
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
 * Labels is a mixin to the Series class. Labels methods are implemented
 * in each of the Series (Pie, Bar, etc) for label creation and placement.
 *
 * The 2 methods that must be implemented by the Series are:
 *
 * - {@link #onCreateLabel}
 * - {@link #onPlaceLabel}
 *
 * The application can override these methods to control the style and
 * location of the labels. For instance, to display the labels in green and
 * add a '+' symbol when the value of a Line series exceeds 50:
 *
 *      Ext.define('Ext.chart.series.MyLine', {
 *          extend: 'Ext.chart.series.Line',
 *          alias: ['series.myline', 'Ext.chart.series.MyLine'],
 *          type: 'MYLINE',
 *     
 *          onPlaceLabel: function(label, storeItem, item, i, display, animate){
 *              if (storeItem.data.y >= 50) {
 *                  label.setAttributes({
 *                      fill: '#080',
 *                      text: "+" + storeItem.data.y
 *                  }, true);
 *              }
 *              return this.callParent(arguments);
 *          }
 *      });
 *
 * Note that for simple effects, like the example above, it is simpler
 * for the application to provide a label.renderer function in the config:
 *
 *       label: {
 *           renderer: function(value, label, storeItem, item, i, display, animate, index) {
 *               if (value >= 50) {
 *                   label.setAttributes({fill:'#080'});
 *                   value = "+" + value;
 *               }
 *               return value;
 *           }
 *       }
 *
 * The rule of thumb is that to customize the value and modify simple visual attributes, it
 * is simpler to use a renderer function, while overridding `onCreateLabel` and `onPlaceLabel`
 * allows the application to take entire control over the labels.
 * 
 */
Ext.define('Ext.chart.Label', {

    /* Begin Definitions */

                                 

    /* End Definitions */

    /**
     * @method onCreateLabel
     * @template
     * 
     * Called each time a new label is created.
     * 
     * **Note:** This method must be implemented in Series that mixes
     * in this Label mixin.
     * 
     * @param {Ext.data.Model} storeItem The element of the store that is
     * related to the sprite.
     * @param {Object} item The item related to the sprite.
     * An item is an object containing the position of the shape
     * used to describe the visualization and also pointing to the
     * actual shape (circle, rectangle, path, etc).
     * @param {Number} i The index of the element created
     * (i.e the first created label, second created label, etc).
     * @param {String} display The label.display type.
     * May be `false` if the label is hidden
     * @return {Ext.draw.Sprite} The created sprite that will draw the label.
     */
    
    /**
     * @method onPlaceLabel
     * @template
     * 
     * Called for updating the position of the label.
     * 
     * **Note:** This method must be implemented in Series that mixes
     * in this Label mixin.
     * 
     * @param {Ext.draw.Sprite} label The sprite that draws the label.
     * @param {Ext.data.Model} storeItem The element of the store
     * that is related to the sprite.
     * @param {Object} item The item related to the
     * sprite. An item is an object containing the position of
     * the shape used to describe the visualization and also
     * pointing to the actual shape (circle, rectangle, path, etc).
     * @param {Number} i The index of the element to be updated
     * (i.e. whether it is the first, second, third from the
     * labelGroup)
     * @param {String} display The label.display type.
     * May be `false` if the label is hidden
     * @param {Boolean} animate A boolean value to set or unset
     * animations for the labels.
     * @param {Number} index The series index.
     */
    
    /**
     * @cfg {Object} label
     * Object with the following properties:
     *
     * @cfg {String} label.display
     *
     * Specifies the presence and position of the labels. The possible values depend on the chart type. 
     * For Line and Scatter charts: "under" | "over" | "rotate".
     * For Bar and Column charts: "insideStart" | "insideEnd" | "outside".
     * For Pie charts: "outside" | "rotate".
     * For all charts: "none" hides the labels and "middle" is reserved for future use.
     * On stacked Bar and stacked Column charts, if 'stackedDisplay' is set, the values
     * "over" or "under" can be passed internally to {@link #onCreateLabel} and {@link #onPlaceLabel}
     * (however they cannot be used by the application as config values for label.display).
     *
     * Default value: 'none'.
     *
     * @cfg {String} label.stackedDisplay
     *
     * The type of label we want to display as a summary on a stacked
     * bar or a stacked column.  If set to 'total', the total amount
     * of all the stacked values is displayed on top of the column.
     * If set to 'balances', the total amount of the positive values
     * is displayed on top of the column and the total amount of the
     * negative values is displayed at the bottom.
     *
     * Default value: 'none'.
     *
     * @cfg {String} label.color
     *
     * The color of the label text.
     *
     * Default value: '#000' (black).
     *
     * @cfg {Boolean} label.contrast
     *
     * True to render the label in contrasting color with the backround of a column
     * in a Bar chart or of a slice in a Pie chart. The label color should be specified
     * in hex values (eg. '#f00' or '#ff0000'), not as a CSS color name (eg. 'red').
     *
     * Default value: false.
     *
     * @cfg {String|String[]} label.field
     *
     * The name(s) of the field(s) to be displayed in the labels. If your chart has 3 series
     * that correspond to the fields 'a', 'b', and 'c' of your model and you only want to
     * display labels for the series 'c', you must still provide an array `[null, null, 'c']`.
     *
     * Default value: 'name'.
     *
     * @cfg {Number} label.minMargin
     *
     * Specifies the minimum distance from a label to the origin of
     * the visualization.  This parameter is useful when using
     * PieSeries width variable pie slice lengths.
     *
     * Default value: 50.
     *
     * @cfg {String} label.font
     *
     * The font used for the labels.
     *
     * Default value: `"11px Helvetica, sans-serif"`.
     *
     * @cfg {String} label.orientation
     *
     * Either "horizontal" or "vertical".
     *
     * Default value: `"horizontal"`.
     *
     * @cfg {Function} label.renderer
     *
     * Optional function for formatting the label into a displayable value.
     *
     * The arguments to the method are:
     *
     *   - *`value`* The value
     *   - *`label`*, *`storeItem`*, *`item`*, *`i`*, *`display`*, *`animate`*, *`index`*
     *
     *     Same arguments as {@link #onPlaceLabel}.
     *
     *     Default value: `function(v) { return v; }`
     */

    // @private a regex to parse url type colors.
    colorStringRe: /url\s*\(\s*#([^\/)]+)\s*\)/,

    // @private the mixin constructor. Used internally by Series.
    constructor: function(config) {
        var me = this;
        me.label = Ext.applyIf(me.label || {},
        {
            display: "none",
            stackedDisplay: "none",
            color: "#000",
            field: "name",
            minMargin: 50,
            font: "11px Helvetica, sans-serif",
            orientation: "horizontal",
            renderer: Ext.identityFn
        });

        if (me.label.display !== 'none') {
            me.labelsGroup = me.chart.surface.getGroup(me.seriesId + '-labels');
        }
    },

    // @private a method to render all labels in the labelGroup
    renderLabels: function() {
        var me = this,
            chart = me.chart,
            gradients = chart.gradients,
            items = me.items,
            animate = chart.animate,
            config = me.label,
            display = config.display,
            stackedDisplay = config.stackedDisplay,
            format = config.renderer,
            color = config.color,
            field = [].concat(config.field),
            group = me.labelsGroup,
            groupLength = (group || 0) && group.length,
            store = me.chart.getChartStore(),
            len = store.getCount(),
            itemLength = (items || 0) && items.length,
            ratio = itemLength / len,
            gradientsCount = (gradients || 0) && gradients.length,
            Color = Ext.draw.Color,
            hides = [],
            gradient, i, count, groupIndex, index, j, k, colorStopTotal, colorStopIndex, colorStop, item, label,
            storeItem, sprite, spriteColor, spriteBrightness, labelColor, colorString,
            total, totalPositive, totalNegative, topText, bottomText;

        if (display == 'none' || !group) {
            return;
        }
        // no items displayed, hide all labels
        if(itemLength == 0){
            while(groupLength--) {
                hides.push(groupLength);
            }
        } else {
            for (i = 0, count = 0, groupIndex = 0; i < len; i++) {
                index = 0;
                for (j = 0; j < ratio; j++) {
                    item = items[count];
                    label = group.getAt(groupIndex);
                    storeItem = store.getAt(i);
                    //check the excludes
                    while(this.__excludes && this.__excludes[index]) {
                        index++;
                    }

                    if (!item && label) {
                        label.hide(true);
                        groupIndex++;
                    }

                    if (item && field[j]) {
                        if (!label) {
                            label = me.onCreateLabel(storeItem, item, i, display);
                            if (!label) {
                                break;
                            }
                        }

                        // set color (the app can override it in onPlaceLabel)
                        label.setAttributes({
                            fill: String(color)
                        }, true);

                        // position the label
                        me.onPlaceLabel(label, storeItem, item, i, display, animate, index);
                        groupIndex++;

                        // set contrast
                        if (config.contrast && item.sprite) {
                            sprite = item.sprite;
                            //set the color string to the color to be set, only read the
                            // _endStyle/_to if we're animating, otherwise they're not relevant
                            if (animate && sprite._endStyle) {
                                colorString = sprite._endStyle.fill;
                            } else if (animate && sprite._to) {
                                colorString = sprite._to.fill;
                            } else {
                                colorString = sprite.attr.fill;
                            }
                            colorString = colorString || sprite.attr.fill;

                            spriteColor = Color.fromString(colorString);
                            //color wasn't parsed property maybe because it's a gradient id
                            if (colorString && !spriteColor) {
                                colorString = colorString.match(me.colorStringRe)[1];
                                for (k = 0; k < gradientsCount; k++) {
                                    gradient = gradients[k];
                                    if (gradient.id == colorString) {
                                        //avg color stops
                                        colorStop = 0; colorStopTotal = 0;
                                        for (colorStopIndex in gradient.stops) {
                                            colorStop++;
                                            colorStopTotal += Color.fromString(gradient.stops[colorStopIndex].color).getGrayscale();
                                        }
                                        spriteBrightness = (colorStopTotal / colorStop) / 255;
                                        break;
                                    }
                                }
                            }
                            else {
                                spriteBrightness = spriteColor.getGrayscale() / 255;
                            }
                            if (label.isOutside) {
                                spriteBrightness = 1;
                            }
                            labelColor = Color.fromString(label.attr.fill || label.attr.color).getHSL();
                            labelColor[2] = spriteBrightness > 0.5 ? 0.2 : 0.8;
                            label.setAttributes({
                                fill: String(Color.fromHSL.apply({}, labelColor))
                            }, true);
                        }

                        // display totals on stacked charts
                        if (me.stacked && stackedDisplay && (item.totalPositiveValues || item.totalNegativeValues)) {
                            totalPositive = (item.totalPositiveValues || 0);
                            totalNegative = (item.totalNegativeValues || 0);
                            total = totalPositive + totalNegative;

                            if (stackedDisplay == 'total') {
                                topText = format(total);
                            } else if (stackedDisplay == 'balances') {
                                if (totalPositive == 0 && totalNegative == 0) {
                                    topText = format(0);
                                } else {
                                    topText = format(totalPositive);
                                    bottomText = format(totalNegative);
                                }
                            }

                            if (topText) {
                                label = group.getAt(groupIndex);
                                if (!label) {
                                    label = me.onCreateLabel(storeItem, item, i, 'over');
                                }
                                labelColor = Color.fromString(label.attr.color || label.attr.fill).getHSL();
                                label.setAttributes({
                                    text: topText,
                                    style: config.font,
                                    fill: String(Color.fromHSL.apply({}, labelColor))
                                }, true);
                                me.onPlaceLabel(label, storeItem, item, i, 'over', animate, index);
                                groupIndex ++;
                            }

                            if (bottomText) {
                                label = group.getAt(groupIndex);
                                if (!label) {
                                    label = me.onCreateLabel(storeItem, item, i, 'under');
                                }
                                labelColor = Color.fromString(label.attr.color || label.attr.fill).getHSL();
                                label.setAttributes({
                                    text: bottomText,
                                    style: config.font,
                                    fill: String(Color.fromHSL.apply({}, labelColor))
                                }, true);
                                me.onPlaceLabel(label, storeItem, item, i, 'under', animate, index);
                                groupIndex ++;
                            }
                        }
                    }
                    count++;
                    index++;
                }
            }
            groupLength = group.length;
        
            while(groupLength > groupIndex){
                hides.push(groupIndex);
                groupIndex++;
           }
        }
        me.hideLabels(hides);
    },

    hideLabels: function(hides){
        var labelsGroup = this.labelsGroup,
            hlen = !!hides && hides.length;

        if (!labelsGroup) {
            return;
        }

        if (hlen === false) {
            hlen = labelsGroup.getCount();
            while (hlen--) {
              labelsGroup.getAt(hlen).hide(true);
            }
        } else {
            while(hlen--) {
                labelsGroup.getAt(hides[hlen]).hide(true);
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
 * @private
 */
Ext.define('Ext.chart.TipSurface', {

    /* Begin Definitions */

    extend:  Ext.draw.Component ,

    /* End Definitions */

    spriteArray: false,
    renderFirst: true,

    constructor: function(config) {
        this.callParent([config]);
        if (config.sprites) {
            this.spriteArray = [].concat(config.sprites);
            delete config.sprites;
        }
    },

    onRender: function() {
        var me = this,
            i = 0,
            l = 0,
            sp,
            sprites;
            this.callParent(arguments);
        sprites = me.spriteArray;
        if (me.renderFirst && sprites) {
            me.renderFirst = false;
            for (l = sprites.length; i < l; i++) {
                sp = me.surface.add(sprites[i]);
                sp.setAttributes({
                    hidden: false
                },
                true);
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
 * @class Ext.chart.Tip
 * Provides tips for Ext.chart.series.Series.
 */
Ext.define('Ext.chart.Tip', {

    /* Begin Definitions */

                                                          

    /* End Definitions */

    constructor: function(config) {
        var me = this,
            surface,
            sprites,
            tipSurface;
        if (config.tips) {
            me.tipTimeout = null;
            me.tipConfig = Ext.apply({}, config.tips, {
                renderer: Ext.emptyFn,
                constrainPosition: true,
                autoHide: true
            });
            me.tooltip = new Ext.tip.ToolTip(me.tipConfig);
            me.chart.surface.on('mousemove', me.tooltip.onMouseMove, me.tooltip);
            me.chart.surface.on('mouseleave', function() {
                me.hideTip();
            });
            if (me.tipConfig.surface) {
                //initialize a surface
                surface = me.tipConfig.surface;
                sprites = surface.sprites;
                tipSurface = new Ext.chart.TipSurface({
                    id: 'tipSurfaceComponent',
                    sprites: sprites
                });
                if (surface.width && surface.height) {
                    tipSurface.setSize(surface.width, surface.height);
                }
                me.tooltip.add(tipSurface);
                me.spriteTip = tipSurface;
            }
        }
    },

    showTip: function(item) {
        var me = this,
            tooltip,
            spriteTip,
            tipConfig,
            trackMouse,
            sprite,
            surface,
            surfaceExt,
            pos,
            x,
            y;
        if (!me.tooltip) {
            return;
        }
        clearTimeout(me.tipTimeout);
        tooltip = me.tooltip;
        spriteTip = me.spriteTip;
        tipConfig = me.tipConfig;
        trackMouse = tooltip.trackMouse;
        if (!trackMouse) {
            tooltip.trackMouse = true;
            sprite = item.sprite;
            surface = sprite.surface;
            surfaceExt = Ext.get(surface.getId());
            if (surfaceExt) {
                pos = surfaceExt.getXY();
                x = pos[0] + (sprite.attr.x || 0) + (sprite.attr.translation && sprite.attr.translation.x || 0);
                y = pos[1] + (sprite.attr.y || 0) + (sprite.attr.translation && sprite.attr.translation.y || 0);
                tooltip.targetXY = [x, y];
            }
        }
        if (spriteTip) {
            tipConfig.renderer.call(tooltip, item.storeItem, item, spriteTip.surface);
        } else {
            tipConfig.renderer.call(tooltip, item.storeItem, item);
        }
        tooltip.show();
        tooltip.trackMouse = trackMouse;
    },

    hideTip: function(item) {
        var tooltip = this.tooltip;
        if (!tooltip) {
            return;
        }
        clearTimeout(this.tipTimeout);
        this.tipTimeout = setTimeout(function() {
            tooltip.hide();
        }, 0);
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
 * @class Ext.chart.axis.Abstract
 * Base class for all axis classes.
 * @private
 */
Ext.define('Ext.chart.axis.Abstract', {

    /* Begin Definitions */

                                  

    /* End Definitions */
    
    /**
     * @cfg {Ext.chart.Label} label
     * The config for chart label.
     */

    /**
     * @cfg {String[]} fields
     * The fields of model to bind to this axis.
     * 
     * For example if you have a data set of lap times per car, each having the fields:
     * `'carName'`, `'avgSpeed'`, `'maxSpeed'`. Then you might want to show the data on chart
     * with `['carName']` on Name axis and `['avgSpeed', 'maxSpeed']` on Speed axis.
     */

    /**
     * Creates new Axis.
     * @param {Object} config (optional) Config options.
     */
    constructor: function(config) {
        config = config || {};

        var me = this,
            pos = config.position || 'left';

        pos = pos.charAt(0).toUpperCase() + pos.substring(1);
        //axisLabel(Top|Bottom|Right|Left)Style
        config.label = Ext.apply(config['axisLabel' + pos + 'Style'] || {}, config.label || {});
        config.axisTitleStyle = Ext.apply(config['axisTitle' + pos + 'Style'] || {}, config.labelTitle || {});
        Ext.apply(me, config);
        me.fields = Ext.Array.from(me.fields);
        this.callParent();
        me.labels = [];
        me.getId();
        me.labelGroup = me.chart.surface.getGroup(me.axisId + "-labels");
    },

    alignment: null,
    grid: false,
    steps: 10,
    x: 0,
    y: 0,
    minValue: 0,
    maxValue: 0,

    getId: function() {
        return this.axisId || (this.axisId = Ext.id(null, 'ext-axis-'));
    },

    /*
      Called to process a view i.e to make aggregation and filtering over
      a store creating a substore to be used to render the axis. Since many axes
      may do different things on the data and we want the final result of all these
      operations to be rendered we need to call processView on all axes before drawing
      them.
    */
    processView: Ext.emptyFn,

    drawAxis: Ext.emptyFn,
    addDisplayAndLabels: Ext.emptyFn
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
 * @class Ext.chart.axis.Axis
 *
 * Defines axis for charts. The axis position, type, style can be configured.
 * The axes are defined in an axes array of configuration objects where the type,
 * field, grid and other configuration options can be set. To know more about how
 * to create a Chart please check the Chart class documentation. Here's an example for the axes part:
 * An example of axis for a series (in this case for an area chart that has multiple layers of yFields) could be:
 *
 *     axes: [{
 *         type: 'Numeric',
 *         position: 'left',
 *         fields: ['data1', 'data2', 'data3'],
 *         title: 'Number of Hits',
 *         grid: {
 *             odd: {
 *                 opacity: 1,
 *                 fill: '#ddd',
 *                 stroke: '#bbb',
 *                 'stroke-width': 1
 *             }
 *         },
 *         minimum: 0
 *     }, {
 *         type: 'Category',
 *         position: 'bottom',
 *         fields: ['name'],
 *         title: 'Month of the Year',
 *         grid: true,
 *         label: {
 *             rotate: {
 *                 degrees: 315
 *             }
 *         }
 *     }]
 *
 * In this case we use a `Numeric` axis for displaying the values of the Area series and a `Category` axis for displaying the names of
 * the store elements. The numeric axis is placed on the left of the screen, while the category axis is placed at the bottom of the chart.
 * Both the category and numeric axes have `grid` set, which means that horizontal and vertical lines will cover the chart background. In the
 * category axis the labels will be rotated so they can fit the space better.
 */
Ext.define('Ext.chart.axis.Axis', {

    /* Begin Definitions */

    extend:  Ext.chart.axis.Abstract ,

    alternateClassName: 'Ext.chart.Axis',

                                

    /* End Definitions */

    /**
     * @cfg {Boolean/Object} grid
     * The grid configuration enables you to set a background grid for an axis.
     * If set to *true* on a vertical axis, vertical lines will be drawn.
     * If set to *true* on a horizontal axis, horizontal lines will be drawn.
     * If both are set, a proper grid with horizontal and vertical lines will be drawn.
     *
     * You can set specific options for the grid configuration for odd and/or even lines/rows.
     * Since the rows being drawn are rectangle sprites, you can set to an odd or even property
     * all styles that apply to {@link Ext.draw.Sprite}. For more information on all the style
     * properties you can set please take a look at {@link Ext.draw.Sprite}. Some useful style 
     * properties are `opacity`, `fill`, `stroke`, `stroke-width`, etc.
     *
     * The possible values for a grid option are then *true*, *false*, or an object with `{ odd, even }` properties
     * where each property contains a sprite style descriptor object that is defined in {@link Ext.draw.Sprite}.
     *
     * For example:
     *
     *     axes: [{
     *         type: 'Numeric',
     *         position: 'left',
     *         fields: ['data1', 'data2', 'data3'],
     *         title: 'Number of Hits',
     *         grid: {
     *             odd: {
     *                 opacity: 1,
     *                 fill: '#ddd',
     *                 stroke: '#bbb',
     *                 'stroke-width': 1
     *             }
     *         }
     *     }, {
     *         type: 'Category',
     *         position: 'bottom',
     *         fields: ['name'],
     *         title: 'Month of the Year',
     *         grid: true
     *     }]
     *
     */

    /**
     * @cfg {Number} majorTickSteps
     * If `minimum` and `maximum` are specified it forces the number of major ticks to the specified value.
     * If a number of major ticks is forced, it wont search for pretty numbers at the ticks.
     */

    /**
     * @cfg {Number} minorTickSteps
     * The number of small ticks between two major ticks. Default is zero.
     */

    /**
     * @cfg {String} title
     * The title for the Axis
     */

     /**
      * @cfg {Boolean} hidden
      * `true` to hide the axis.
      */
     hidden: false,

    // @private force min/max values from store
    forceMinMax: false,

    /**
     * @cfg {Number} dashSize
     * The size of the dash marker. Default's 3.
     */
    dashSize: 3,

    /**
     * @cfg {String} position
     * Where to set the axis. Available options are `left`, `bottom`, `right`, `top`. Default's `bottom`.
     */
    position: 'bottom',

    // @private
    skipFirst: false,

    /**
     * @cfg {Number} length
     * Offset axis position. Default's 0.
     */
    length: 0,

    /**
     * @cfg {Number} width
     * Offset axis width. Default's 0.
     */
    width: 0,

    /**
     * @cfg {Boolean} adjustEnd
     * Whether to adjust the label at the end of the axis.
     */
    adjustEnd: true,

    majorTickSteps: false,
    
    nullGutters: { lower: 0, upper: 0, verticalAxis: undefined },

    // @private
    applyData: Ext.emptyFn,

    getRange: function () {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            data = store.data.items,
            series = chart.series.items,
            position = me.position,
            axes,
            seriesClasses = Ext.chart.series,
            aggregations = [],
            min = Infinity, max = -Infinity,
            vertical = me.position === 'left' || me.position === 'right' || me.position === 'radial',
            i, ln, ln2, j, k, dataLength = data.length, aggregates,
            countedFields = {},
            allFields = {},
            excludable = true,
            fields, fieldMap, record, field, value;

        fields = me.fields;
        for (j = 0, ln = fields.length; j < ln; j++) {
            allFields[fields[j]] = true;
        }

        for (i = 0, ln = series.length; i < ln; i++) {
            if (series[i].seriesIsHidden) {
                continue;
            }
            if (!series[i].getAxesForXAndYFields) {
                continue;
            }
            axes = series[i].getAxesForXAndYFields();
            if (axes.xAxis && axes.xAxis !== position && axes.yAxis && axes.yAxis !== position) {
                // The series doesn't use this axis.
                continue;
            }

            if (seriesClasses.Bar && series[i] instanceof seriesClasses.Bar && !series[i].column) {
                // If this is a horizontal bar series, then flip xField and yField.
                fields = vertical ? Ext.Array.from(series[i].xField) : Ext.Array.from(series[i].yField);
            } else {
                fields = vertical ? Ext.Array.from(series[i].yField) : Ext.Array.from(series[i].xField);
            }

            if (me.fields.length) {
                for (j = 0, ln2 = fields.length; j < ln2; j++) {
                    if (allFields[fields[j]]) {
                        break;
                    }
                }
                if (j == ln2) {
                    // Not matching fields, skipping this series.
                    continue;
                }
            }

            if (aggregates = series[i].stacked) {
                // If this is a bar/column series, then it will be aggregated if it is of the same direction of the axis.
                if (seriesClasses.Bar && series[i] instanceof seriesClasses.Bar) {
                    if (series[i].column != vertical) {
                        aggregates = false;
                        excludable = false;
                    }
                }
                // Otherwise it is stacked vertically
                else if (!vertical) {
                    aggregates = false;
                    excludable = false;
                }
            }


            if (aggregates) {
                fieldMap = {};
                for (j = 0; j < fields.length; j++) {
                    if (excludable && series[i].__excludes && series[i].__excludes[j]) {
                        continue;
                    }
                    if (!allFields[fields[j]]) {
                        Ext.Logger.warn('Field `' + fields[j] + '` is not included in the ' + position + ' axis config.');
                    }
                    allFields[fields[j]] = fieldMap[fields[j]] = true;
                }
                aggregations.push({
                    fields: fieldMap,
                    positiveValue: 0,
                    negativeValue: 0
                });
            } else {

                if (!fields || fields.length == 0) {
                    fields = me.fields;
                }
                for (j = 0; j < fields.length; j++) {
                    if (excludable && series[i].__excludes && series[i].__excludes[j]) {
                        continue;
                    }
                    allFields[fields[j]] = countedFields[fields[j]] = true;
                }
            }
        }

        for (i = 0; i < dataLength; i++) {
            record = data[i];
            for (k = 0; k < aggregations.length; k++) {
                aggregations[k].positiveValue = 0;
                aggregations[k].negativeValue = 0;
            }
            for (field in allFields) {
                value = record.get(field);
                if (me.type == 'Time' && typeof value == "string") {
                    value = Date.parse(value);
                }
                if (isNaN(value)) {
                    continue;
                }
                if (value === undefined) {
                    value = 0;
                } else {
                    value = Number(value);
                }
                if (countedFields[field]) {
                    if (min > value) {
                        min = value;
                    }
                    if (max < value) {
                        max = value;
                    }
                }
                for (k = 0; k < aggregations.length; k++) {
                    if (aggregations[k].fields[field]) {

                        if (value >= 0) {
                            aggregations[k].positiveValue += value;
                            if (max < aggregations[k].positiveValue) {
                                max = aggregations[k].positiveValue;
                            }
                            // If any aggregation is actually hit, then the min value should be at most 0.
                            if (min > 0) {
                                min = 0;
                            }
                        } else {
                            aggregations[k].negativeValue += value;
                            if (min > aggregations[k].negativeValue) {
                                min = aggregations[k].negativeValue;
                            }
                            // If any aggregation is actually hit, then the max value should be at least 0.
                            if (max < 0) {
                                max = 0;
                            }
                        }
                    }
                }
            }
        }

        if (!isFinite(max)) {
            max = me.prevMax || 0;
        }
        if (!isFinite(min)) {
            min = me.prevMin || 0;
        }

        if (typeof min === 'number') {
            min = Ext.Number.correctFloat(min);
        }
         
        if (typeof max === 'number') {
            max = Ext.Number.correctFloat(max);
        }
        
        //normalize min max for snapEnds.
        if (min != max && (max != Math.floor(max) || min != Math.floor(min))) {
            min = Math.floor(min);
            max = Math.floor(max) + 1;
        }

        if (!isNaN(me.minimum)) {
            min = me.minimum;
        }

        if (!isNaN(me.maximum)) {
            max = me.maximum;
        }

        if (min >= max) {
            // snapEnds will return NaN if max >= min;
            min = Math.floor(min);
            max = min + 1;                
        }

        return {min: min, max: max};
    },

    // @private creates a structure with start, end and step points.
    calcEnds: function () {
        var me = this,
            range = me.getRange(),
            min = range.min,
            max = range.max,
            steps, prettyNumbers, out, changedRange;

        steps = (Ext.isNumber(me.majorTickSteps) ? me.majorTickSteps + 1 : me.steps);
        prettyNumbers = !(Ext.isNumber(me.maximum) && Ext.isNumber(me.minimum) && Ext.isNumber(me.majorTickSteps) && me.majorTickSteps > 0);

        out = Ext.draw.Draw.snapEnds(min, max, steps, prettyNumbers);

        if (Ext.isNumber(me.maximum)) {
            out.to = me.maximum;
            changedRange = true;
        }
        if (Ext.isNumber(me.minimum)) {
            out.from = me.minimum;
            changedRange = true;
        }
        if (me.adjustMaximumByMajorUnit) {
            out.to = Math.ceil(out.to / out.step) * out.step;
            changedRange = true;
        }
        if (me.adjustMinimumByMajorUnit) {
            out.from = Math.floor(out.from / out.step) * out.step;
            changedRange = true;
        }

        if (changedRange) {
            out.steps = Math.ceil((out.to - out.from) / out.step);            
        }

        me.prevMin = (min == max ? 0 : min);
        me.prevMax = max;
        return out;
    },


    /**
     * Renders the axis into the screen and updates its position.
     */
    drawAxis: function (init) {
        var me = this,
            i, 
            x = me.x,
            y = me.y,
            dashSize = me.dashSize,
            length = me.length,
            position = me.position,
            verticalAxis = (position == 'left' || position == 'right'),
            inflections = [],
            calcLabels = (me.isNumericAxis),
            stepCalcs = me.applyData(),
            step = stepCalcs.step,
            steps = stepCalcs.steps,
            stepsArray = Ext.isArray(steps),
            from = stepCalcs.from,
            to = stepCalcs.to,
            // If we have a single item, to - from will be 0.
            axisRange = (to - from) || 1,
            trueLength,
            currentX,
            currentY,
            path,
            subDashesX = me.minorTickSteps || 0,
            subDashesY = me.minorTickSteps || 0,
            dashesX = Math.max(subDashesX + 1, 0),
            dashesY = Math.max(subDashesY + 1, 0),
            dashDirection = (position == 'left' || position == 'top' ? -1 : 1),
            dashLength = dashSize * dashDirection,
            series = me.chart.series.items,
            firstSeries = series[0],
            gutters = firstSeries ? firstSeries.nullGutters : me.nullGutters,
            padding,
            subDashes,
            subDashValue,
            delta = 0,
            stepCount = 0,
            tick, axes, ln, val, begin, end;

        me.from = from;
        me.to = to;
        
        // If there is nothing to show, then leave. 
        if (me.hidden || (from > to)) {
            return;
        }

        // If no steps are specified (for instance if the store is empty), then leave.
        if ((stepsArray && (steps.length == 0)) || (!stepsArray && isNaN(step))) {
            return;
        }

        if (stepsArray) {
            // Clean the array of steps:
            // First remove the steps that are out of bounds.
            steps = Ext.Array.filter(steps, function(elem, index, array) {
                return (+elem > +me.from && +elem < +me.to);
            }, this);

            // Then add bounds on each side.
            steps = Ext.Array.union([me.from], steps, [me.to]);
        }
        else {
            // Build the array of steps out of the fixed-value 'step'.
            steps = new Array;
            for (val = +me.from; val < +me.to; val += step) {
                steps.push(val);
            }
            steps.push(+me.to);
        }
        stepCount = steps.length;


        // Get the gutters for this series
        for (i = 0, ln = series.length; i < ln; i++) {
            if (series[i].seriesIsHidden) {
                continue;
            }
            if (!series[i].getAxesForXAndYFields) {
                continue;
            }
            axes = series[i].getAxesForXAndYFields();
            if (!axes.xAxis || !axes.yAxis || (axes.xAxis === position) || (axes.yAxis === position)) {
                gutters = series[i].getGutters();
                if ((gutters.verticalAxis !== undefined) && (gutters.verticalAxis != verticalAxis)) {
                    // This series has gutters that don't apply to the direction of this axis
                    // (for instance, gutters for Bars apply to the vertical axis while gutters  
                    // for Columns apply to the horizontal axis). Since there is no gutter, the 
                    // padding is all that is left to take into account.
                    padding = series[i].getPadding();
                    if (verticalAxis) {
                        gutters = { lower: padding.bottom, upper: padding.top, verticalAxis: true };
                    } else {
                        gutters = { lower: padding.left, upper: padding.right, verticalAxis: false };
                    }
                }
                break;
            }
        }

        // Draw the major ticks

        if (calcLabels) {
            me.labels = [];
        }

        if (gutters) {
            if (verticalAxis) {
                currentX = Math.floor(x);
                path = ["M", currentX + 0.5, y, "l", 0, -length];
                trueLength = length - (gutters.lower + gutters.upper);

                for (tick = 0; tick < stepCount; tick++) {
                    currentY = y - gutters.lower - (steps[tick] - steps[0]) * trueLength / axisRange;
                    path.push("M", currentX, Math.floor(currentY) + 0.5, "l", dashLength * 2, 0);

                    inflections.push([ currentX, Math.floor(currentY) ]);

                    if (calcLabels) {
                        me.labels.push(steps[tick]);
                    }
                }
            } else {
                currentY = Math.floor(y);
                path = ["M", x, currentY + 0.5, "l", length, 0];
                trueLength = length - (gutters.lower + gutters.upper);

                for (tick = 0; tick < stepCount; tick++) {
                    currentX = x + gutters.lower + (steps[tick] - steps[0]) * trueLength / axisRange;
                    path.push("M", Math.floor(currentX) + 0.5, currentY, "l", 0, dashLength * 2 + 1);

                    inflections.push([ Math.floor(currentX), currentY ]);

                    if (calcLabels) {
                        me.labels.push(steps[tick]);
                    }
                }
            }
        }


        // Draw the minor ticks

        // If 'minorTickSteps' is...
        // - A number: it contains the number of minor ticks between 2 major ticks.
        // - An array with 2 numbers: it contains a date interval like [Ext.Date.DAY,2].
        // - An array with a single number: it contains the value of a minor tick.
        subDashes = (verticalAxis ? subDashesY : subDashesX);
        if (Ext.isArray(subDashes)) {
            if (subDashes.length == 2) {
                subDashValue = +Ext.Date.add(new Date(), subDashes[0], subDashes[1]) - Date.now();
            } else {
                subDashValue = subDashes[0];
            }
        }
        else {
            if (Ext.isNumber(subDashes) && subDashes > 0) {
                subDashValue = step / (subDashes + 1);
            }
        }

        if (gutters && subDashValue) {
            for (tick = 0; tick < stepCount - 1; tick++) {
                begin = +steps[tick];
                end = +steps[tick+1];
                if (verticalAxis) {
                    for (value = begin + subDashValue; value < end; value += subDashValue) {
                        currentY = y - gutters.lower - (value - steps[0]) * trueLength / axisRange;
                        path.push("M", currentX, Math.floor(currentY) + 0.5, "l", dashLength, 0);
                    }
                }
                else {
                    for (value = begin + subDashValue; value < end; value += subDashValue) {
                        currentX = x + gutters.upper + (value - steps[0]) * trueLength / axisRange;
                        path.push("M", Math.floor(currentX) + 0.5, currentY, "l", 0, dashLength + 1);
                    }
                }
            }            
        }


        // Render

        if (!me.axis) {
            me.axis = me.chart.surface.add(Ext.apply({
                type: 'path',
                path: path
            }, me.axisStyle));
        }
        me.axis.setAttributes({
            path: path
        }, true);
        me.inflections = inflections;
        if (!init && me.grid) {
            me.drawGrid();
        }
        me.axisBBox = me.axis.getBBox();
        me.drawLabel();
    },

    /**
     * Renders an horizontal and/or vertical grid into the Surface.
     */
    drawGrid: function () {
        var me = this,
            surface = me.chart.surface,
            grid = me.grid,
            odd = grid.odd,
            even = grid.even,
            inflections = me.inflections,
            ln = inflections.length - ((odd || even) ? 0 : 1),
            position = me.position,
            maxGutters = me.chart.maxGutters,
            width = me.width - 2,
            point, prevPoint,
            i = 1,
            path = [], styles, lineWidth, dlineWidth,
            oddPath = [], evenPath = [];

        if (((maxGutters.bottom !== 0 || maxGutters.top !== 0) && (position == 'left' || position == 'right')) ||
            ((maxGutters.left !== 0 || maxGutters.right !== 0) && (position == 'top' || position == 'bottom'))) {
            i = 0;
            ln++;
        }
        for (; i < ln; i++) {
            point = inflections[i];
            prevPoint = inflections[i - 1];
            if (odd || even) {
                path = (i % 2) ? oddPath : evenPath;
                styles = ((i % 2) ? odd : even) || {};
                lineWidth = (styles.lineWidth || styles['stroke-width'] || 0) / 2;
                dlineWidth = 2 * lineWidth;
                if (position == 'left') {
                    path.push("M", prevPoint[0] + 1 + lineWidth, prevPoint[1] + 0.5 - lineWidth,
                        "L", prevPoint[0] + 1 + width - lineWidth, prevPoint[1] + 0.5 - lineWidth,
                        "L", point[0] + 1 + width - lineWidth, point[1] + 0.5 + lineWidth,
                        "L", point[0] + 1 + lineWidth, point[1] + 0.5 + lineWidth, "Z");
                }
                else if (position == 'right') {
                    path.push("M", prevPoint[0] - lineWidth, prevPoint[1] + 0.5 - lineWidth,
                        "L", prevPoint[0] - width + lineWidth, prevPoint[1] + 0.5 - lineWidth,
                        "L", point[0] - width + lineWidth, point[1] + 0.5 + lineWidth,
                        "L", point[0] - lineWidth, point[1] + 0.5 + lineWidth, "Z");
                }
                else if (position == 'top') {
                    path.push("M", prevPoint[0] + 0.5 + lineWidth, prevPoint[1] + 1 + lineWidth,
                        "L", prevPoint[0] + 0.5 + lineWidth, prevPoint[1] + 1 + width - lineWidth,
                        "L", point[0] + 0.5 - lineWidth, point[1] + 1 + width - lineWidth,
                        "L", point[0] + 0.5 - lineWidth, point[1] + 1 + lineWidth, "Z");
                }
                else {
                    path.push("M", prevPoint[0] + 0.5 + lineWidth, prevPoint[1] - lineWidth,
                        "L", prevPoint[0] + 0.5 + lineWidth, prevPoint[1] - width + lineWidth,
                        "L", point[0] + 0.5 - lineWidth, point[1] - width + lineWidth,
                        "L", point[0] + 0.5 - lineWidth, point[1] - lineWidth, "Z");
                }
            } else {
                if (position == 'left') {
                    path = path.concat(["M", point[0] + 0.5, point[1] + 0.5, "l", width, 0]);
                }
                else if (position == 'right') {
                    path = path.concat(["M", point[0] - 0.5, point[1] + 0.5, "l", -width, 0]);
                }
                else if (position == 'top') {
                    path = path.concat(["M", point[0] + 0.5, point[1] + 0.5, "l", 0, width]);
                }
                else {
                    path = path.concat(["M", point[0] + 0.5, point[1] - 0.5, "l", 0, -width]);
                }
            }
        }
        if (odd || even) {
            if (oddPath.length) {
                if (!me.gridOdd && oddPath.length) {
                    me.gridOdd = surface.add({
                        type: 'path',
                        path: oddPath
                    });
                }
                me.gridOdd.setAttributes(Ext.apply({
                    path: oddPath,
                    hidden: false
                }, odd || {}), true);
            }
            if (evenPath.length) {
                if (!me.gridEven) {
                    me.gridEven = surface.add({
                        type: 'path',
                        path: evenPath
                    });
                }
                me.gridEven.setAttributes(Ext.apply({
                    path: evenPath,
                    hidden: false
                }, even || {}), true);
            }
        }
        else {
            if (path.length) {
                if (!me.gridLines) {
                    me.gridLines = me.chart.surface.add({
                        type: 'path',
                        path: path,
                        "stroke-width": me.lineWidth || 1,
                        stroke: me.gridColor || '#ccc'
                    });
                }
                me.gridLines.setAttributes({
                    hidden: false,
                    path: path
                }, true);
            }
            else if (me.gridLines) {
                me.gridLines.hide(true);
            }
        }
    },

    // @private
    getOrCreateLabel: function (i, text) {
        var me = this,
            labelGroup = me.labelGroup,
            textLabel = labelGroup.getAt(i),
            surface = me.chart.surface;
        if (textLabel) {
            if (text != textLabel.attr.text) {
                textLabel.setAttributes(Ext.apply({
                    text: text
                }, me.label), true);
                textLabel._bbox = textLabel.getBBox();
            }
        }
        else {
            textLabel = surface.add(Ext.apply({
                group: labelGroup,
                type: 'text',
                x: 0,
                y: 0,
                text: text
            }, me.label));
            surface.renderItem(textLabel);
            textLabel._bbox = textLabel.getBBox();
        }
        //get untransformed bounding box
        if (me.label.rotation) {
            textLabel.setAttributes({
                rotation: {
                    degrees: 0
                }
            }, true);
            textLabel._ubbox = textLabel.getBBox();
            textLabel.setAttributes(me.label, true);
        } else {
            textLabel._ubbox = textLabel._bbox;
        }
        return textLabel;
    },

    rect2pointArray: function (sprite) {
        var surface = this.chart.surface,
            rect = surface.getBBox(sprite, true),
            p1 = [rect.x, rect.y],
            p1p = p1.slice(),
            p2 = [rect.x + rect.width, rect.y],
            p2p = p2.slice(),
            p3 = [rect.x + rect.width, rect.y + rect.height],
            p3p = p3.slice(),
            p4 = [rect.x, rect.y + rect.height],
            p4p = p4.slice(),
            matrix = sprite.matrix;
        //transform the points
        p1[0] = matrix.x.apply(matrix, p1p);
        p1[1] = matrix.y.apply(matrix, p1p);

        p2[0] = matrix.x.apply(matrix, p2p);
        p2[1] = matrix.y.apply(matrix, p2p);

        p3[0] = matrix.x.apply(matrix, p3p);
        p3[1] = matrix.y.apply(matrix, p3p);

        p4[0] = matrix.x.apply(matrix, p4p);
        p4[1] = matrix.y.apply(matrix, p4p);
        return [p1, p2, p3, p4];
    },

    intersect: function (l1, l2) {
        var r1 = this.rect2pointArray(l1),
            r2 = this.rect2pointArray(l2);
        return !!Ext.draw.Draw.intersect(r1, r2).length;
    },

    drawHorizontalLabels: function () {
        var me = this,
            labelConf = me.label,
            floor = Math.floor,
            max = Math.max,
            axes = me.chart.axes,
            insetPadding = me.chart.insetPadding,
            gutters = me.chart.maxGutters,
            position = me.position,
            inflections = me.inflections,
            ln = inflections.length,
            labels = me.labels,
            maxHeight = 0,
            ratio,
            bbox, point, prevLabel, prevLabelId,
            adjustEnd = me.adjustEnd,
            hasLeft = axes.findIndex('position', 'left') != -1,
            hasRight = axes.findIndex('position', 'right') != -1,
            textLabel, text,
            last, x, y, i, firstLabel;

        last = ln - 1;
        //get a reference to the first text label dimensions
        point = inflections[0];
        firstLabel = me.getOrCreateLabel(0, me.label.renderer(labels[0]));
        ratio = Math.floor(Math.abs(Math.sin(labelConf.rotate && (labelConf.rotate.degrees * Math.PI / 180) || 0)));

        for (i = 0; i < ln; i++) {
            point = inflections[i];
            text = me.label.renderer(labels[i]);
            textLabel = me.getOrCreateLabel(i, text);
            bbox = textLabel._bbox;
            maxHeight = max(maxHeight, bbox.height + me.dashSize + me.label.padding);
            x = floor(point[0] - (ratio ? bbox.height : bbox.width) / 2);
            if (adjustEnd && gutters.left == 0 && gutters.right == 0) {
                if (i == 0 && !hasLeft) {
                    x = point[0];
                }
                else if (i == last && !hasRight) {
                    x = Math.min(x, point[0] - bbox.width + insetPadding);
                }
            }
            if (position == 'top') {
                y = point[1] - (me.dashSize * 2) - me.label.padding - (bbox.height / 2);
            }
            else {
                y = point[1] + (me.dashSize * 2) + me.label.padding + (bbox.height / 2);
            }

            textLabel.setAttributes({
                hidden: false,
                x: x,
                y: y
            }, true);

            // Skip label if there isn't available minimum space
            if (i != 0 && (me.intersect(textLabel, prevLabel)
                || me.intersect(textLabel, firstLabel))) {
                if (i === last && prevLabelId !== 0) {
                    prevLabel.hide(true);
                } else {
                    textLabel.hide(true);
                    continue;
                }
            }

            prevLabel = textLabel;
            prevLabelId = i;
        }

        return maxHeight;
    },

    drawVerticalLabels: function () {
        var me = this,
            inflections = me.inflections,
            position = me.position,
            ln = inflections.length,
            chart = me.chart,
            insetPadding = chart.insetPadding,
            labels = me.labels,
            maxWidth = 0,
            max = Math.max,
            floor = Math.floor,
            ceil = Math.ceil,
            axes = me.chart.axes,
            gutters = me.chart.maxGutters,
            bbox, point, prevLabel, prevLabelId,
            hasTop = axes.findIndex('position', 'top') != -1,
            hasBottom = axes.findIndex('position', 'bottom') != -1,
            adjustEnd = me.adjustEnd,
            textLabel, text,
            last = ln - 1, x, y, i;

        for (i = 0; i < ln; i++) {
            point = inflections[i];
            text = me.label.renderer(labels[i]);
            textLabel = me.getOrCreateLabel(i, text);
            bbox = textLabel._bbox;

            maxWidth = max(maxWidth, bbox.width + me.dashSize + me.label.padding);
            y = point[1];
            if (adjustEnd && (gutters.bottom + gutters.top) < bbox.height / 2) {
                if (i == last && !hasTop) {
                    y = Math.max(y, me.y - me.length + ceil(bbox.height / 2) - insetPadding);
                }
                else if (i == 0 && !hasBottom) {
                    y = me.y + gutters.bottom - floor(bbox.height / 2);
                }
            }
            if (position == 'left') {
                x = point[0] - bbox.width - me.dashSize - me.label.padding - 2;
            }
            else {
                x = point[0] + me.dashSize + me.label.padding + 2;
            }
            textLabel.setAttributes(Ext.apply({
                hidden: false,
                x: x,
                y: y
            }, me.label), true);
            // Skip label if there isn't available minimum space
            if (i != 0 && me.intersect(textLabel, prevLabel)) {
                if (i === last && prevLabelId !== 0) {
                    prevLabel.hide(true);
                } else {
                    textLabel.hide(true);
                    continue;
                }
            }
            prevLabel = textLabel;
            prevLabelId = i;
        }

        return maxWidth;
    },

    /**
     * Renders the labels in the axes.
     */
    drawLabel: function () {
        var me = this,
            position = me.position,
            labelGroup = me.labelGroup,
            inflections = me.inflections,
            maxWidth = 0,
            maxHeight = 0,
            ln, i;

        if (position == 'left' || position == 'right') {
            maxWidth = me.drawVerticalLabels();
        } else {
            maxHeight = me.drawHorizontalLabels();
        }

        // Hide unused bars
        ln = labelGroup.getCount();
        i = inflections.length;
        for (; i < ln; i++) {
            labelGroup.getAt(i).hide(true);
        }

        me.bbox = {};
        Ext.apply(me.bbox, me.axisBBox);
        me.bbox.height = maxHeight;
        me.bbox.width = maxWidth;
        if (Ext.isString(me.title)) {
            me.drawTitle(maxWidth, maxHeight);
        }
    },

    /**
     * Updates the {@link #title} of this axis.
     * @param {String} title
     */
    setTitle: function (title) {
        this.title = title;
        this.drawLabel();
    },

    // @private draws the title for the axis.
    drawTitle: function (maxWidth, maxHeight) {
        var me = this,
            position = me.position,
            surface = me.chart.surface,
            displaySprite = me.displaySprite,
            title = me.title,
            rotate = (position == 'left' || position == 'right'),
            x = me.x,
            y = me.y,
            base, bbox, pad;

        if (displaySprite) {
            displaySprite.setAttributes({text: title}, true);
        } else {
            base = {
                type: 'text',
                x: 0,
                y: 0,
                text: title
            };
            displaySprite = me.displaySprite = surface.add(Ext.apply(base, me.axisTitleStyle, me.labelTitle));
            surface.renderItem(displaySprite);
        }
        bbox = displaySprite.getBBox();
        pad = me.dashSize + me.label.padding;

        if (rotate) {
            y -= ((me.length / 2) - (bbox.height / 2));
            if (position == 'left') {
                x -= (maxWidth + pad + (bbox.width / 2));
            }
            else {
                x += (maxWidth + pad + bbox.width - (bbox.width / 2));
            }
            me.bbox.width += bbox.width + 10;
        }
        else {
            x += (me.length / 2) - (bbox.width * 0.5);
            if (position == 'top') {
                y -= (maxHeight + pad + (bbox.height * 0.3));
            }
            else {
                y += (maxHeight + pad + (bbox.height * 0.8));
            }
            me.bbox.height += bbox.height + 10;
        }
        displaySprite.setAttributes({
            translate: {
                x: x,
                y: y
            }
        }, true);
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
 * @class Ext.chart.axis.Numeric
 *
 * An axis to handle numeric values. This axis is used for quantitative data as
 * opposed to the category axis. You can set mininum and maximum values to the
 * axis so that the values are bound to that. If no values are set, then the
 * scale will auto-adjust to the values.
 *
 *     @example
 *     var store = Ext.create('Ext.data.JsonStore', {
 *          fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5'],
 *          data: [
 *              {'name':'metric one', 'data1':10, 'data2':12, 'data3':14, 'data4':8, 'data5':13},
 *              {'name':'metric two', 'data1':7, 'data2':8, 'data3':16, 'data4':10, 'data5':3},
 *              {'name':'metric three', 'data1':5, 'data2':2, 'data3':14, 'data4':12, 'data5':7},
 *              {'name':'metric four', 'data1':2, 'data2':14, 'data3':6, 'data4':1, 'data5':23},
 *              {'name':'metric five', 'data1':27, 'data2':38, 'data3':36, 'data4':13, 'data5':33}
 *          ]
 *     });
 *
 *     Ext.create('Ext.chart.Chart', {
 *         renderTo: Ext.getBody(),
 *         width: 500,
 *         height: 300,
 *         store: store,
 *         axes: [{
 *             type: 'Numeric',
 *             position: 'left',
 *             fields: ['data1', 'data2', 'data3', 'data4', 'data5'],
 *             title: 'Sample Values',
 *             grid: {
 *                 odd: {
 *                     opacity: 1,
 *                     fill: '#ddd',
 *                     stroke: '#bbb',
 *                     'stroke-width': 1
 *                 }
 *             },
 *             minimum: 0,
 *             adjustMinimumByMajorUnit: 0
 *         }, {
 *             type: 'Category',
 *             position: 'bottom',
 *             fields: ['name'],
 *             title: 'Sample Metrics',
 *             grid: true,
 *             label: {
 *                 rotate: {
 *                     degrees: 315
 *                 }
 *             }
 *         }],
 *         series: [{
 *             type: 'area',
 *             highlight: false,
 *             axis: 'left',
 *             xField: 'name',
 *             yField: ['data1', 'data2', 'data3', 'data4', 'data5'],
 *             style: {
 *                 opacity: 0.93
 *             }
 *         }]
 *     });
 *
 * In this example we create an axis of Numeric type. We set a minimum value so that
 * even if all series have values greater than zero, the grid starts at zero. We bind
 * the axis onto the left part of the surface by setting `position` to `left`.
 * We bind three different store fields to this axis by setting `fields` to an array.
 * We set the title of the axis to _Number of Hits_ by using the `title` property.
 * We use a `grid` configuration to set odd background rows to a certain style and even rows
 * to be transparent/ignored.
 */
Ext.define('Ext.chart.axis.Numeric', {

    /* Begin Definitions */

    extend:  Ext.chart.axis.Axis ,

    alternateClassName: 'Ext.chart.NumericAxis',

    /* End Definitions */

    type: 'Numeric',

    // @private
    isNumericAxis: true,

    alias: 'axis.numeric',

                             

    constructor: function(config) {
        var me = this,
            hasLabel = !!(config.label && config.label.renderer),
            label;

        me.callParent([config]);
        label = me.label;

        if (config.constrain == null) {
            me.constrain = (config.minimum != null && config.maximum != null);
        }

        if (!hasLabel) {
            label.renderer = function(v) {
                return me.roundToDecimal(v, me.decimals);
            };
        }
    },

    roundToDecimal: function(v, dec) {
        var val = Math.pow(10, dec || 0);
        return Math.round(v * val) / val;
    },

    /**
     * @cfg {Number} minimum
     * The minimum value drawn by the axis. If not set explicitly, the axis
     * minimum will be calculated automatically. It is ignored for stacked charts.
     */
    minimum: NaN,

    /**
     * @cfg {Number} maximum
     * The maximum value drawn by the axis. If not set explicitly, the axis
     * maximum will be calculated automatically. It is ignored for stacked charts.
     */
    maximum: NaN,

    /**
     * @cfg {Boolean} constrain
     * If true, the values of the chart will be rendered only if they belong between minimum and maximum.
     * If false, all values of the chart will be rendered, regardless of whether they belong between minimum and maximum or not.
     * Default's true if maximum and minimum is specified. It is ignored for stacked charts.
     */
    constrain: true,

    /**
     * @cfg {Number} decimals
     * The number of decimals to round the value to.
     */
    decimals: 2,

    /**
     * @cfg {String} scale
     * The scaling algorithm to use on this axis. May be "linear" or
     * "logarithmic".  Currently only linear scale is implemented.
     * @private
     */
    scale: "linear",

    // @private constrains to datapoints between minimum and maximum only
    doConstrain: function() {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            items = store.data.items,
            d, dLen, record,
            series = chart.series.items,
            fields = me.fields,
            ln = fields.length,
            range = me.calcEnds(),
            min = range.from, max = range.to, i, l,
            useAcum = false,
            value, data = [],
            addRecord;

        for (d = 0, dLen = items.length; d < dLen; d++) {
            addRecord = true;
            record = items[d];
            for (i = 0; i < ln; i++) {
                value = record.get(fields[i]);
                if (me.type == 'Time' && typeof value == "string") {
                    value = Date.parse(value);
                }
                if (+value < +min) {
                    addRecord = false;
                    break;
                }
                if (+value > +max) {
                    addRecord = false;
                    break;
                }
            }
            if (addRecord) {
                data.push(record);
            }
        }
        
        chart.setSubStore(new Ext.data.Store({
            model: store.model,
            data: data
        }));
    },
    /**
     * @cfg {String} position
     * Indicates the position of the axis relative to the chart
     */
    position: 'left',

    /**
     * @cfg {Boolean} adjustMaximumByMajorUnit
     * Indicates whether to extend maximum beyond data's maximum to the nearest
     * majorUnit.
     */
    adjustMaximumByMajorUnit: false,

    /**
     * @cfg {Boolean} adjustMinimumByMajorUnit
     * Indicates whether to extend the minimum beyond data's minimum to the
     * nearest majorUnit.
     */
    adjustMinimumByMajorUnit: false,

    // applying constraint
    processView: function() {
        var me = this,
            chart = me.chart,
            series = chart.series.items,
            i, l;

        for (i = 0, l = series.length; i < l; i++) {
            if (series[i].stacked) {
                // Do not constrain stacked charts (bar, column, or area).
                delete me.minimum;
                delete me.maximum;
                me.constrain = false;
                break;
            }
        }

        if (me.constrain) {
            me.doConstrain();
        }
    },

    // @private apply data.
    applyData: function() {
        this.callParent();
        return this.calcEnds();
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
 * @class Ext.chart.series.Series
 *
 * Series is the abstract class containing the common logic to all chart series. Series includes
 * methods from Labels, Highlights, Tips and Callouts mixins. This class implements the logic of handling
 * mouse events, animating, hiding, showing all elements and returning the color of the series to be used as a legend item.
 *
 * ## Listeners
 *
 * The series class supports listeners via the Observable syntax. Some of these listeners are:
 *
 *  - `itemclick` When the user interacts with a marker.
 *  - `itemmouseup` When the user interacts with a marker.
 *  - `itemmousedown` When the user interacts with a marker.
 *  - `itemmousemove` When the user iteracts with a marker.
 *  - `afterrender` Will be triggered when the animation ends or when the series has been rendered completely.
 *
 * For example:
 *
 *     series: [{
 *             type: 'column',
 *             axis: 'left',
 *             listeners: {
 *                     'afterrender': function() {
 *                             console('afterrender');
 *                     }
 *             },
 *             xField: 'category',
 *             yField: 'data1'
 *     }]
 */
Ext.define('Ext.chart.series.Series', {

    /* Begin Definitions */

    mixins: {
        observable:  Ext.util.Observable ,
        labels:  Ext.chart.Label ,
        highlights:  Ext.chart.Highlight ,
        tips:  Ext.chart.Tip ,
        callouts:  Ext.chart.Callout 
    },

    /* End Definitions */

    /**
     * @cfg {Boolean/Object} highlight
     * If set to `true` it will highlight the markers or the series when hovering
     * with the mouse. This parameter can also be an object with the same style
     * properties you would apply to a {@link Ext.draw.Sprite} to apply custom
     * styles to markers and series.
     */

    /**
     * @cfg {Object} tips
     * Add tooltips to the visualization's markers. The options for the tips are the
     * same configuration used with {@link Ext.tip.ToolTip}. For example:
     *
     *     tips: {
     *       trackMouse: true,
     *       width: 140,
     *       height: 28,
     *       renderer: function(storeItem, item) {
     *         this.setTitle(storeItem.get('name') + ': ' + storeItem.get('data1') + ' views');
     *       }
     *     },
     */

    /**
     * @cfg {String} type
     * The type of series. Set in subclasses.
     */
    type: null,

    /**
     * @cfg {String} title
     * The human-readable name of the series.
     */
    title: null,

    /**
     * @cfg {Boolean} showInLegend
     * Whether to show this series in the legend.
     */
    showInLegend: true,

    /**
     * @cfg {Function} renderer
     * A function that can be overridden to set custom styling properties to each rendered element.
     * Passes in (sprite, record, attributes, index, store) to the function.
     */
    renderer: function(sprite, record, attributes, index, store) {
        return attributes;
    },

    /**
     * @cfg {Array} shadowAttributes
     * An array with shadow attributes
     */
    shadowAttributes: null,

    // @private animating flag
    animating: false,

    // @private default gutters
    nullGutters: { lower: 0, upper: 0, verticalAxis: undefined },

    // @private default padding
    nullPadding: { left:0, right:0, width:0, bottom:0, top:0, height:0 },

    /**
     * @cfg {Object} listeners
     * An (optional) object with event callbacks. All event callbacks get the target *item* as first parameter. The callback functions are:
     *
     *  - itemclick
     *  - itemmouseover
     *  - itemmouseout
     *  - itemmousedown
     *  - itemmouseup
     */

    constructor: function(config) {
        var me = this;
        if (config) {
            Ext.apply(me, config);
        }

        me.shadowGroups = [];

        me.mixins.labels.constructor.call(me, config);
        me.mixins.highlights.constructor.call(me, config);
        me.mixins.tips.constructor.call(me, config);
        me.mixins.callouts.constructor.call(me, config);

        me.addEvents({
            scope: me,
            itemclick: true,
            itemmouseover: true,
            itemmouseout: true,
            itemmousedown: true,
            itemmouseup: true,
            mouseleave: true,
            afterdraw: true,

            /**
             * @event titlechange
             * Fires when the series title is changed via {@link #setTitle}.
             * @param {String} title The new title value
             * @param {Number} index The index in the collection of titles
             */
            titlechange: true
        });

        me.mixins.observable.constructor.call(me, config);

        me.on({
            scope: me,
            itemmouseover: me.onItemMouseOver,
            itemmouseout: me.onItemMouseOut,
            mouseleave: me.onMouseLeave
        });
        
        if (me.style) {
            Ext.apply(me.seriesStyle, me.style);
        }
    },
    
    onRedraw: Ext.emptyFn,
    
    /**
     * Iterate over each of the records for this series. The default implementation simply iterates
     * through the entire data store, but individual series implementations can override this to
     * provide custom handling, e.g. adding/removing records.
     * @param {Function} fn The function to execute for each record.
     * @param {Object} scope Scope for the fn.
     */
    eachRecord: function(fn, scope) {
        var chart = this.chart;
        chart.getChartStore().each(fn, scope);
    },

    /**
     * Return the number of records being displayed in this series. Defaults to the number of
     * records in the store; individual series implementations can override to provide custom handling.
     */
    getRecordCount: function() {
        var chart = this.chart,
            store = chart.getChartStore();
        return store ? store.getCount() : 0;
    },

    /**
     * Determines whether the series item at the given index has been excluded, i.e. toggled off in the legend.
     * @param index
     */
    isExcluded: function(index) {
        var excludes = this.__excludes;
        return !!(excludes && excludes[index]);
    },

    // @private set the bbox and clipBox for the series
    setBBox: function(noGutter) {
        var me = this,
            chart = me.chart,
            chartBBox = chart.chartBBox,
            maxGutters = noGutter ? { left: 0, right: 0, bottom: 0, top: 0 } : chart.maxGutters,
            clipBox, bbox;

        clipBox = {
            x: chartBBox.x,
            y: chartBBox.y,
            width: chartBBox.width,
            height: chartBBox.height
        };
        me.clipBox = clipBox;

        bbox = {
            x: (clipBox.x + maxGutters.left) - (chart.zoom.x * chart.zoom.width),
            y: (clipBox.y + maxGutters.bottom) - (chart.zoom.y * chart.zoom.height),
            width: (clipBox.width - (maxGutters.left + maxGutters.right)) * chart.zoom.width,
            height: (clipBox.height - (maxGutters.bottom + maxGutters.top)) * chart.zoom.height
        };
        me.bbox = bbox;
    },

    // @private set the animation for the sprite
    onAnimate: function(sprite, attr) {
        var me = this;
        sprite.stopAnimation();
        if (me.animating) {
            return sprite.animate(Ext.applyIf(attr, me.chart.animate));
        } else {
            me.animating = true;
            return sprite.animate(Ext.apply(Ext.applyIf(attr, me.chart.animate), {
                // use callback, don't overwrite listeners
                callback: function() {
                    me.animating = false;
                    me.fireEvent('afterrender');
                }
            }));
        }
    },

    // @private return the gutters.
    getGutters: function() {
        return this.nullGutters;
    },

    // @private return the gutters.
    getPadding: function() {
        return this.nullPadding;
    },

    // @private wrapper for the itemmouseover event.
    onItemMouseOver: function(item) {
        var me = this;
        if (item.series === me) {
            if (me.highlight) {
                me.highlightItem(item);
            }
            if (me.tooltip) {
                me.showTip(item);
            }
        }
    },

    // @private wrapper for the itemmouseout event.
    onItemMouseOut: function(item) {
        var me = this;
        if (item.series === me) {
            me.unHighlightItem();
            if (me.tooltip) {
                me.hideTip(item);
            }
        }
    },

    // @private wrapper for the mouseleave event.
    onMouseLeave: function() {
        var me = this;
        me.unHighlightItem();
        if (me.tooltip) {
            me.hideTip();
        }
    },

    /**
     * For a given x/y point relative to the Surface, find a corresponding item from this
     * series, if any.
     * @param {Number} x
     * @param {Number} y
     * @return {Object} An object describing the item, or null if there is no matching item.
     * The exact contents of this object will vary by series type, but should always contain the following:
     * @return {Ext.chart.series.Series} return.series the Series object to which the item belongs
     * @return {Object} return.value the value(s) of the item's data point
     * @return {Array} return.point the x/y coordinates relative to the chart box of a single point
     * for this data item, which can be used as e.g. a tooltip anchor point.
     * @return {Ext.draw.Sprite} return.sprite the item's rendering Sprite.
     */
    getItemForPoint: function(x, y) {
        //if there are no items to query just return null.
        if (!this.items || !this.items.length || this.seriesIsHidden) {
            return null;
        }
        var me = this,
            items = me.items,
            bbox = me.bbox,
            item, i, ln;
        // Check bounds
        if (!Ext.draw.Draw.withinBox(x, y, bbox)) {
            return null;
        }
        for (i = 0, ln = items.length; i < ln; i++) {
            if (items[i] && this.isItemInPoint(x, y, items[i], i)) {
                return items[i];
            }
        }

        return null;
    },

    isItemInPoint: function(x, y, item, i) {
        return false;
    },

    /**
     * Hides all the elements in the series.
     */
    hideAll: function() {
        var me = this,
            items = me.items,
            item, len, i, j, l, sprite, shadows;

        me.seriesIsHidden = true;
        me._prevShowMarkers = me.showMarkers;

        me.showMarkers = false;
        //hide all labels
        me.hideLabels(0);
        //hide all sprites
        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            sprite = item.sprite;
            if (sprite) {
                sprite.setAttributes({
                    hidden: true
                }, true);
            }

            if (sprite && sprite.shadows) {
                shadows = sprite.shadows;
                for (j = 0, l = shadows.length; j < l; ++j) {
                    shadows[j].setAttributes({
                        hidden: true
                    }, true);
                }
            }
        }
    },

    /**
     * Shows all the elements in the series.
     */
    showAll: function() {
        var me = this,
            prevAnimate = me.chart.animate;
        me.chart.animate = false;
        me.seriesIsHidden = false;
        me.showMarkers = me._prevShowMarkers;
        me.drawSeries();
        me.chart.animate = prevAnimate;
    },
    
    hide: function() {
        if (this.items) {
            var me = this,
                items = me.items,
                i, j, lsh, ln, shadows;
            
            if (items && items.length) {
                for (i = 0, ln = items.length; i < ln; ++i) {
                    if (items[i].sprite) {
                        items[i].sprite.hide(true);

                        shadows = items[i].shadows || items[i].sprite.shadows;
                        if (shadows) {
                            for (j = 0, lsh = shadows.length; j < lsh; ++j) {
                                shadows[j].hide(true);
                            }
                        }
                    }
                }
                me.hideLabels();
            }
        }
    },

    /**
     * Returns a string with the color to be used for the series legend item.
     */
    getLegendColor: function(index) {
        var me = this, fill, stroke;
        if (me.seriesStyle) {
            fill = me.seriesStyle.fill;
            stroke = me.seriesStyle.stroke;
            if (fill && fill != 'none') {
                return fill;
            }
            if(stroke){
                return stroke;
            }
        }
        return (me.colorArrayStyle)?me.colorArrayStyle[me.themeIdx % me.colorArrayStyle.length]:'#000';
    },

    /**
     * Checks whether the data field should be visible in the legend
     * @private
     * @param {Number} index The index of the current item
     */
    visibleInLegend: function(index){
        var excludes = this.__excludes;
        if (excludes) {
            return !excludes[index];
        }
        return !this.seriesIsHidden;
    },

    /**
     * Changes the value of the {@link #title} for the series.
     * Arguments can take two forms:
     * <ul>
     * <li>A single String value: this will be used as the new single title for the series (applies
     * to series with only one yField)</li>
     * <li>A numeric index and a String value: this will set the title for a single indexed yField.</li>
     * </ul>
     * @param {Number} index
     * @param {String} title
     */
    setTitle: function(index, title) {
        var me = this,
            oldTitle = me.title;

        if (Ext.isString(index)) {
            title = index;
            index = 0;
        }

        if (Ext.isArray(oldTitle)) {
            oldTitle[index] = title;
        } else {
            me.title = title;
        }

        me.fireEvent('titlechange', title, index);
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
 * @class Ext.chart.series.Cartesian
 *
 * Common base class for series implementations which plot values using x/y coordinates.
 */
Ext.define('Ext.chart.series.Cartesian', {

    /* Begin Definitions */

    extend:  Ext.chart.series.Series ,

    alternateClassName: ['Ext.chart.CartesianSeries', 'Ext.chart.CartesianChart'],

    /* End Definitions */

    /**
     * @cfg {String} xField
     * The name of the data Model field corresponding to the x-axis value.
     */
    xField: null,

    /**
     * @cfg {String/String[]} yField
     * The name(s) of the data Model field(s) corresponding to the y-axis value(s).
     */
    yField: null,

    /**
     * @cfg {String/String[]} axis
     * The position of the axis to bind the values to. Possible values are 'left', 'bottom', 'top' and 'right'.
     * You must explicitly set this value to bind the values of the line series to the ones in the axis, otherwise a
     * relative scale will be used. For example, if you're using a Scatter or Line series and you'd like to have the
     * values in the chart relative to the bottom and left axes then `axis` should be `['left', 'bottom']`.
     */
    axis: 'left',

    getLegendLabels: function() {
        var me = this,
            labels = [],
            fields, i, ln,
            combinations = me.combinations,
            title,
            combo, label0, label1;

        fields = [].concat(me.yField);
        for (i = 0, ln = fields.length; i < ln; i++) {
            title = me.title;
            // Use the 'title' config if present, otherwise use the raw yField name
            labels.push((Ext.isArray(title) ? title[i] : title) || fields[i]);
        }

        // Handle yFields combined via legend drag-drop
        // TODO need to check to see if this is supported in extjs 4 branch
        if (combinations) {
            combinations = Ext.Array.from(combinations);
            for (i = 0, ln = combinations.length; i < ln; i++) {
                combo = combinations[i];
                label0 = labels[combo[0]];
                label1 = labels[combo[1]];
                labels[combo[1]] = label0 + ' & ' + label1;
                labels.splice(combo[0], 1);
            }
        }

        return labels;
    },

    /**
     * @protected Iterates over a given record's values for each of this series's yFields,
     * executing a given function for each value. Any yFields that have been combined
     * via legend drag-drop will be treated as a single value.
     * @param {Ext.data.Model} record
     * @param {Function} fn
     * @param {Object} scope
     */
    eachYValue: function(record, fn, scope) {
        var me = this,
            yValueAccessors = me.getYValueAccessors(),
            i, ln, accessor;
        
        for (i = 0, ln = yValueAccessors.length; i < ln; i++) {
            accessor = yValueAccessors[i];
            fn.call(scope, accessor(record), i);
        }
    },

    /**
     * @protected Returns the number of yField values, taking into account fields combined
     * via legend drag-drop.
     * @return {Number}
     */
    getYValueCount: function() {
        return this.getYValueAccessors().length;
    },

    combine: function(index1, index2) {
        var me = this,
            accessors = me.getYValueAccessors(),
            accessor1 = accessors[index1],
            accessor2 = accessors[index2];

        // Combine the yValue accessors for the two indexes into a single accessor that returns their sum
        accessors[index2] = function(record) {
            return accessor1(record) + accessor2(record);
        };
        accessors.splice(index1, 1);

        me.callParent([index1, index2]);
    },

    clearCombinations: function() {
        // Clear combined accessors, they'll get regenerated on next call to getYValueAccessors
        delete this.yValueAccessors;
        this.callParent();
    },

    /**
     * @protected Returns an array of functions, each of which returns the value of the yField
     * corresponding to function's index in the array, for a given record (each function takes the
     * record as its only argument.) If yFields have been combined by the user via legend drag-drop,
     * this list of accessors will be kept in sync with those combinations.
     * @return {Array} array of accessor functions
     */
    getYValueAccessors: function() {
        var me = this,
            accessors = me.yValueAccessors,
            yFields, yField, i, ln;
        if (!accessors) {
            accessors = me.yValueAccessors = [];
            yFields = [].concat(me.yField);
            
            for (i = 0, ln = yFields.length; i < ln; i++) {
                yField = yFields[i];
                accessors.push(function(record) {
                    return record.get(yField);
                });
            }
        }
        return accessors;
    },

    /**
     * Calculate the min and max values for this series's xField.
     * @return {Array} [min, max]
     */
    getMinMaxXValues: function() {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            data = store.data.items,
            count = me.getRecordCount(),
            i, ln, record,
            min, max,
            xField = me.xField,
            xValue;

        if (count > 0) {
            min = Infinity;
            max = -min;
                
            for (i = 0, ln = data.length; i < ln; i++) {
                record = data[i];
                xValue = record.get(xField);
                if (xValue > max) {
                    max = xValue;
                }
                if (xValue < min) {
                    min = xValue;
                }
            }
            
            // If we made no progress, treat it like a category axis
            if (min == Infinity) {
                min = 0;
            }
            
            if (max == -Infinity) {
                max = count - 1;
            }
        } else {
            min = max = 0;
        }
        return [min, max];
    },

    /**
     * Calculate the min and max values for this series's yField(s). Takes into account yField
     * combinations, exclusions, and stacking.
     * @return {Array} [min, max]
     */
    getMinMaxYValues: function() {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            data = store.data.items,
            count = me.getRecordCount(),
            i, ln, record,
            stacked = me.stacked,
            min, max,
            positiveTotal, negativeTotal;

        function eachYValueStacked(yValue, i) {
            if (!me.isExcluded(i)) {
                if (yValue < 0) {
                    negativeTotal += yValue;
                } else {
                    positiveTotal += yValue;
                }
            }
        }

        function eachYValue(yValue, i) {
            if (!me.isExcluded(i)) {
                if (yValue > max) {
                    max = yValue;
                }
                if (yValue < min) {
                    min = yValue;
                }
            }
        }

        if (count > 0) {
            min = Infinity;
            max = -min;
            
            for (i = 0, ln = data.length; i < ln; i++) {
                record = data[i];
                if (stacked) {
                    positiveTotal = 0;
                    negativeTotal = 0;
                    me.eachYValue(record, eachYValueStacked);
                    if (positiveTotal > max) {
                        max = positiveTotal;
                    }
                    if (negativeTotal < min) {
                        min = negativeTotal;
                    }
                } else {
                    me.eachYValue(record, eachYValue);
                }
            }
            
            // If we made no progress, treat it like a category axis
            if (min == Infinity) {
                min = 0;
            }
            
            if (max == -Infinity) {
                max = count - 1;
            }
        } else {
            min = max = 0;
        }
        return [min, max];
    },

    getAxesForXAndYFields: function() {
        var me = this,
            axes = me.chart.axes,
            axis = [].concat(me.axis),
            yFields = {}, yFieldList = [].concat(me.yField),
            xFields = {}, xFieldList = [].concat(me.xField),
            fields, xAxis, yAxis, i, ln, flipXY;

        
        flipXY = me.type === 'bar' && me.column === false;
        if(flipXY) {
            fields = yFieldList;
            yFieldList = xFieldList;
            xFieldList = fields;
        }
        if (Ext.Array.indexOf(axis, 'top') > -1) {
            xAxis = 'top';
        } else if (Ext.Array.indexOf(axis, 'bottom') > -1) {
            xAxis = 'bottom';
        } else {
            if (axes.get('top') && axes.get('bottom')) {
                for (i = 0, ln = xFieldList.length; i < ln; i++) {
                    xFields[xFieldList[i]] = true;
                }
                fields = [].concat(axes.get('bottom').fields);
                for (i = 0, ln = fields.length; i < ln; i++) {
                    if (xFields[fields[i]]) {
                        xAxis = 'bottom';
                        break
                    }
                }
                fields = [].concat(axes.get('top').fields);
                for (i = 0, ln = fields.length; i < ln; i++) {
                    if (xFields[fields[i]]) {
                        xAxis = 'top';
                        break
                    }
                }
            } else if (axes.get('top')) {
                xAxis = 'top';
            } else if (axes.get('bottom')) {
                xAxis = 'bottom';
            }
        }
        if (Ext.Array.indexOf(axis, 'left') > -1) {
            yAxis = 'left';
        } else if (Ext.Array.indexOf(axis, 'right') > -1) {
            yAxis = 'right';
        } else {
            if (axes.get('left') && axes.get('right')) {
                for (i = 0, ln = yFieldList.length; i < ln; i++) {
                    yFields[yFieldList[i]] = true;
                }
                fields = [].concat(axes.get('right').fields);
                for (i = 0, ln = fields.length; i < ln; i++) {
                    if (yFields[fields[i]]) {

                        break
                    }
                }
                fields = [].concat(axes.get('left').fields);
                for (i = 0, ln = fields.length; i < ln; i++) {
                    if (yFields[fields[i]]) {
                        yAxis = 'left';
                        break
                    }
                }
            } else if (axes.get('left')) {
                yAxis = 'left';
            } else if (axes.get('right')) {
                yAxis = 'right';
            }
        }

        return flipXY ? {
            xAxis: yAxis,
            yAxis: xAxis
        }: {
            xAxis: xAxis,
            yAxis: yAxis
        };
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
 * @class Ext.chart.series.Line
 * @extends Ext.chart.series.Cartesian
 *
 * Creates a Line Chart. A Line Chart is a useful visualization technique to display quantitative information for different
 * categories or other real values (as opposed to the bar chart), that can show some progression (or regression) in the dataset.
 * As with all other series, the Line Series must be appended in the *series* Chart array configuration. See the Chart
 * documentation for more information. A typical configuration object for the line series could be:
 *
 *     @example
 *     var store = Ext.create('Ext.data.JsonStore', {
 *         fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5'],
 *         data: [
 *             { 'name': 'metric one',   'data1': 10, 'data2': 12, 'data3': 14, 'data4': 8,  'data5': 13 },
 *             { 'name': 'metric two',   'data1': 7,  'data2': 8,  'data3': 16, 'data4': 10, 'data5': 3  },
 *             { 'name': 'metric three', 'data1': 5,  'data2': 2,  'data3': 14, 'data4': 12, 'data5': 7  },
 *             { 'name': 'metric four',  'data1': 2,  'data2': 14, 'data3': 6,  'data4': 1,  'data5': 23 },
 *             { 'name': 'metric five',  'data1': 4,  'data2': 4,  'data3': 36, 'data4': 13, 'data5': 33 }
 *         ]
 *     });
 *
 *     Ext.create('Ext.chart.Chart', {
 *         renderTo: Ext.getBody(),
 *         width: 500,
 *         height: 300,
 *         animate: true,
 *         store: store,
 *         axes: [
 *             {
 *                 type: 'Numeric',
 *                 position: 'left',
 *                 fields: ['data1', 'data2'],
 *                 label: {
 *                     renderer: Ext.util.Format.numberRenderer('0,0')
 *                 },
 *                 title: 'Sample Values',
 *                 grid: true,
 *                 minimum: 0
 *             },
 *             {
 *                 type: 'Category',
 *                 position: 'bottom',
 *                 fields: ['name'],
 *                 title: 'Sample Metrics'
 *             }
 *         ],
 *         series: [
 *             {
 *                 type: 'line',
 *                 highlight: {
 *                     size: 7,
 *                     radius: 7
 *                 },
 *                 axis: 'left',
 *                 xField: 'name',
 *                 yField: 'data1',
 *                 markerConfig: {
 *                     type: 'cross',
 *                     size: 4,
 *                     radius: 4,
 *                     'stroke-width': 0
 *                 }
 *             },
 *             {
 *                 type: 'line',
 *                 highlight: {
 *                     size: 7,
 *                     radius: 7
 *                 },
 *                 axis: 'left',
 *                 fill: true,
 *                 xField: 'name',
 *                 yField: 'data2',
 *                 markerConfig: {
 *                     type: 'circle',
 *                     size: 4,
 *                     radius: 4,
 *                     'stroke-width': 0
 *                 }
 *             }
 *         ]
 *     });
 *
 * In this configuration we're adding two series (or lines), one bound to the `data1`
 * property of the store and the other to `data3`. The type for both configurations is
 * `line`. The `xField` for both series is the same, the name propert of the store.
 * Both line series share the same axis, the left axis. You can set particular marker
 * configuration by adding properties onto the markerConfig object. Both series have
 * an object as highlight so that markers animate smoothly to the properties in highlight
 * when hovered. The second series has `fill=true` which means that the line will also
 * have an area below it of the same color.
 *
 * **Note:** In the series definition remember to explicitly set the axis to bind the
 * values of the line series to. This can be done by using the `axis` configuration property.
 */
Ext.define('Ext.chart.series.Line', {

    /* Begin Definitions */

    extend:  Ext.chart.series.Cartesian ,

    alternateClassName: ['Ext.chart.LineSeries', 'Ext.chart.LineChart'],

                                                                                         

    /* End Definitions */

    type: 'line',

    alias: 'series.line',

    /**
     * @cfg {Number} selectionTolerance
     * The offset distance from the cursor position to the line series to trigger events (then used for highlighting series, etc).
     */
    selectionTolerance: 20,

    /**
     * @cfg {Boolean} showMarkers
     * Whether markers should be displayed at the data points along the line. If true,
     * then the {@link #markerConfig} config item will determine the markers' styling.
     */
    showMarkers: true,

    /**
     * @cfg {Object} markerConfig
     * The display style for the markers. Only used if {@link #showMarkers} is true.
     * The markerConfig is a configuration object containing the same set of properties defined in
     * the Sprite class. For example, if we were to set red circles as markers to the line series we could
     * pass the object:
     *
     <pre><code>
        markerConfig: {
            type: 'circle',
            radius: 4,
            'fill': '#f00'
        }
     </code></pre>

     */
    markerConfig: {},

    /**
     * @cfg {Object} style
     * An object containing style properties for the visualization lines and fill.
     * These styles will override the theme styles.  The following are valid style properties:
     *
     * - `stroke` - an rgb or hex color string for the background color of the line
     * - `stroke-width` - the width of the stroke (integer)
     * - `fill` - the background fill color string (hex or rgb), only works if {@link #fill} is `true`
     * - `opacity` - the opacity of the line and the fill color (decimal)
     *
     * Example usage:
     *
     *     style: {
     *         stroke: '#00ff00',
     *         'stroke-width': 10,
     *         fill: '#80A080',
     *         opacity: 0.2
     *     }
     */
    style: {},

    /**
     * @cfg {Boolean/Number} smooth
     * If set to `true` or a non-zero number, the line will be smoothed/rounded around its points; otherwise
     * straight line segments will be drawn.
     *
     * A numeric value is interpreted as a divisor of the horizontal distance between consecutive points in
     * the line; larger numbers result in sharper curves while smaller numbers result in smoother curves.
     *
     * If set to `true` then a default numeric value of 3 will be used. Defaults to `false`.
     */
    smooth: false,

    /**
     * @private Default numeric smoothing value to be used when {@link #smooth} = true.
     */
    defaultSmoothness: 3,

    /**
     * @cfg {Boolean} fill
     * If true, the area below the line will be filled in using the {@link #style eefill} and
     * {@link #style opacity} config properties. Defaults to false.
     */
    fill: false,

    constructor: function(config) {
        this.callParent(arguments);
        var me = this,
            surface = me.chart.surface,
            shadow = me.chart.shadow,
            i, l;
        config.highlightCfg = Ext.Object.merge({ 'stroke-width': 3 }, config.highlightCfg);
        Ext.apply(me, config, {
            shadowAttributes: [{
                "stroke-width": 6,
                "stroke-opacity": 0.05,
                stroke: 'rgb(0, 0, 0)',
                translate: {
                    x: 1,
                    y: 1
                }
            }, {
                "stroke-width": 4,
                "stroke-opacity": 0.1,
                stroke: 'rgb(0, 0, 0)',
                translate: {
                    x: 1,
                    y: 1
                }
            }, {
                "stroke-width": 2,
                "stroke-opacity": 0.15,
                stroke: 'rgb(0, 0, 0)',
                translate: {
                    x: 1,
                    y: 1
                }
            }]
        });
        me.group = surface.getGroup(me.seriesId);
        if (me.showMarkers) {
            me.markerGroup = surface.getGroup(me.seriesId + '-markers');
        }
        if (shadow) {
            for (i = 0, l = me.shadowAttributes.length; i < l; i++) {
                me.shadowGroups.push(surface.getGroup(me.seriesId + '-shadows' + i));
            }
        }
    },

    // @private makes an average of points when there are more data points than pixels to be rendered.
    shrink: function(xValues, yValues, size) {
        // Start at the 2nd point...
        var len = xValues.length,
            ratio = Math.floor(len / size),
            i = 1,
            xSum = 0,
            ySum = 0,
            xRes = [+xValues[0]],
            yRes = [+yValues[0]];

        for (; i < len; ++i) {
            xSum += +xValues[i] || 0;
            ySum += +yValues[i] || 0;
            if (i % ratio == 0) {
                xRes.push(xSum/ratio);
                yRes.push(ySum/ratio);
                xSum = 0;
                ySum = 0;
            }
        }
        return {
            x: xRes,
            y: yRes
        };
    },

    /**
     * Draws the series for the current chart.
     */
    drawSeries: function() {
        var me = this,
            chart = me.chart,
            chartAxes = chart.axes,
            store = chart.getChartStore(),
            data = store.data.items,
            record,
            storeCount = store.getCount(),
            surface = me.chart.surface,
            bbox = {},
            group = me.group,
            showMarkers = me.showMarkers,
            markerGroup = me.markerGroup,
            enableShadows = chart.shadow,
            shadowGroups = me.shadowGroups,
            shadowAttributes = me.shadowAttributes,
            smooth = me.smooth,
            lnsh = shadowGroups.length,
            dummyPath = ["M"],
            path = ["M"],
            renderPath = ["M"],
            smoothPath = ["M"],
            markerIndex = chart.markerIndex,
            axes = [].concat(me.axis),
            shadowBarAttr,
            xValues = [],
            xValueMap = {},
            yValues = [],
            yValueMap = {},
            onbreak = false,
            storeIndices = [],
            markerStyle = Ext.apply({}, me.markerStyle),
            seriesStyle = me.seriesStyle,
            colorArrayStyle = me.colorArrayStyle,
            colorArrayLength = colorArrayStyle && colorArrayStyle.length || 0,
            isNumber = Ext.isNumber,
            seriesIdx = me.seriesIdx, 
            boundAxes = me.getAxesForXAndYFields(),
            boundXAxis = boundAxes.xAxis,
            boundYAxis = boundAxes.yAxis,
            xAxisType = boundXAxis ? chartAxes.get(boundXAxis).type : '',
            yAxisType = boundYAxis ? chartAxes.get(boundYAxis).type : '',
            shadows, shadow, shindex, fromPath, fill, fillPath, rendererAttributes,
            x, y, prevX, prevY, firstX, firstY, markerCount, i, j, ln, axis, ends, marker, markerAux, item, xValue,
            yValue, coords, xScale, yScale, minX, maxX, minY, maxY, line, animation, endMarkerStyle,
            endLineStyle, type, count, opacity, lineOpacity, fillOpacity, fillDefaultValue;

        if (me.fireEvent('beforedraw', me) === false) {
            return;
        }

        //if store is empty or the series is excluded in the legend then there's nothing to draw.
        if (!storeCount || me.seriesIsHidden) {
            me.hide();
            me.items = [];
            if (me.line) {
                me.line.hide(true);
                if (me.line.shadows) {
                    shadows = me.line.shadows;
                    for (j = 0, lnsh = shadows.length; j < lnsh; j++) {
                        shadow = shadows[j];
                        shadow.hide(true);
                    }
                }
                if (me.fillPath) {
                    me.fillPath.hide(true);
                }
            }
            me.line = null;
            me.fillPath = null;
            return;
        }

        //prepare style objects for line and markers
        endMarkerStyle = Ext.apply(markerStyle || {}, me.markerConfig, {
            fill: me.seriesStyle.fill || colorArrayStyle[me.themeIdx % colorArrayStyle.length]
        });
        type = endMarkerStyle.type;
        delete endMarkerStyle.type;
        endLineStyle = seriesStyle;
        //if no stroke with is specified force it to 0.5 because this is
        //about making *lines*
        if (!endLineStyle['stroke-width']) {
            endLineStyle['stroke-width'] = 0.5;
        }
        
        //set opacity values
        opacity = 'opacity' in endLineStyle ? endLineStyle.opacity : 1;
        fillDefaultValue = 'opacity' in endLineStyle ? endLineStyle.opacity : 0.3;
        lineOpacity = 'lineOpacity' in endLineStyle ? endLineStyle.lineOpacity : opacity;
        fillOpacity = 'fillOpacity' in endLineStyle ? endLineStyle.fillOpacity : fillDefaultValue;

        //If we're using a time axis and we need to translate the points,
        //then reuse the first markers as the last markers.
        if (markerIndex && markerGroup && markerGroup.getCount()) {
            for (i = 0; i < markerIndex; i++) {
                marker = markerGroup.getAt(i);
                markerGroup.remove(marker);
                markerGroup.add(marker);
                markerAux = markerGroup.getAt(markerGroup.getCount() - 2);
                marker.setAttributes({
                    x: 0,
                    y: 0,
                    translate: {
                        x: markerAux.attr.translation.x,
                        y: markerAux.attr.translation.y
                    }
                }, true);
            }
        }

        me.unHighlightItem();
        me.cleanHighlights();

        me.setBBox();
        bbox = me.bbox;
        me.clipRect = [bbox.x, bbox.y, bbox.width, bbox.height];

        if (axis = chartAxes.get(boundXAxis)) {
            ends = axis.applyData();
            minX = ends.from;
            maxX = ends.to;
        }

        if (axis = chartAxes.get(boundYAxis)) {
            ends = axis.applyData();
            minY = ends.from;
            maxY = ends.to;
        }

        // If a field was specified without a corresponding axis, create one to get bounds
        if (me.xField && !Ext.isNumber(minX)) {
            axis = me.getMinMaxXValues();
            minX = axis[0];
            maxX = axis[1];
        }

        if (me.yField && !Ext.isNumber(minY)) {
            axis = me.getMinMaxYValues();
            minY = axis[0];
            maxY = axis[1];
        }
        
        if (isNaN(minX)) {
            minX = 0;
            xScale = bbox.width / ((storeCount - 1) || 1);
        }
        else {
            xScale = bbox.width / ((maxX - minX) || (storeCount -1) || 1);
        }

        if (isNaN(minY)) {
            minY = 0;
            yScale = bbox.height / ((storeCount - 1) || 1);
        }
        else {
            yScale = bbox.height / ((maxY - minY) || (storeCount - 1) || 1);
        }
        // Extract all x and y values from the store
        for (i = 0, ln = data.length; i < ln; i++) {
            record = data[i];
            xValue = record.get(me.xField);
            if (xAxisType == 'Time' && typeof xValue == "string") {
                xValue = Date.parse(xValue);
            }
            // Ensure a value
            if (typeof xValue == 'string' || typeof xValue == 'object' && !Ext.isDate(xValue)
                //set as uniform distribution if the axis is a category axis.
                || boundXAxis && chartAxes.get(boundXAxis) && chartAxes.get(boundXAxis).type == 'Category') {
                    if (xValue in xValueMap) {
                        xValue = xValueMap[xValue];
                    } else {
                        xValue = xValueMap[xValue] = i;
                    }
            }

            // Filter out values that don't fit within the pan/zoom buffer area
            yValue = record.get(me.yField);
            if (yAxisType == 'Time' && typeof yValue == "string") {
                yValue = Date.parse(yValue);
            }
            //skip undefined values
            if (typeof yValue == 'undefined' || (typeof yValue == 'string' && !yValue)) {
                continue;
            }
            // Ensure a value
            if (typeof yValue == 'string' || typeof yValue == 'object' && !Ext.isDate(yValue)
                //set as uniform distribution if the axis is a category axis.
                || boundYAxis && chartAxes.get(boundYAxis) && chartAxes.get(boundYAxis).type == 'Category') {
                yValue = i;
            }
            storeIndices.push(i);
            xValues.push(xValue);
            yValues.push(yValue);
        }

        ln = xValues.length;
        if (ln > bbox.width) {
            coords = me.shrink(xValues, yValues, bbox.width);
            xValues = coords.x;
            yValues = coords.y;
        }

        me.items = [];

        count = 0;
        ln = xValues.length;
        for (i = 0; i < ln; i++) {
            xValue = xValues[i];
            yValue = yValues[i];
            if (yValue === false) {
                if (path.length == 1) {
                    path = [];
                }
                onbreak = true;
                me.items.push(false);
                continue;
            } else {
                x = (bbox.x + (xValue - minX) * xScale).toFixed(2);
                y = ((bbox.y + bbox.height) - (yValue - minY) * yScale).toFixed(2);
                if (onbreak) {
                    onbreak = false;
                    path.push('M');
                }
                path = path.concat([x, y]);
            }
            if ((typeof firstY == 'undefined') && (typeof y != 'undefined')) {
                firstY = y;
                firstX = x;
            }
            // If this is the first line, create a dummypath to animate in from.
            if (!me.line || chart.resizing) {
                dummyPath = dummyPath.concat([x, bbox.y + bbox.height / 2]);
            }

            // When resizing, reset before animating
            if (chart.animate && chart.resizing && me.line) {
                me.line.setAttributes({
                    path: dummyPath,
                    opacity: lineOpacity
                }, true);
                if (me.fillPath) {
                    me.fillPath.setAttributes({
                        path: dummyPath,
                        opacity: fillOpacity
                    }, true);
                }
                if (me.line.shadows) {
                    shadows = me.line.shadows;
                    for (j = 0, lnsh = shadows.length; j < lnsh; j++) {
                        shadow = shadows[j];
                        shadow.setAttributes({
                            path: dummyPath
                        }, true);
                    }
                }
            }
            if (showMarkers) {
                marker = markerGroup.getAt(count++);
                if (!marker) {
                    marker = Ext.chart.Shape[type](surface, Ext.apply({
                        group: [group, markerGroup],
                        x: 0, y: 0,
                        translate: {
                            x: +(prevX || x),
                            y: prevY || (bbox.y + bbox.height / 2)
                        },
                        value: '"' + xValue + ', ' + yValue + '"',
                        zIndex: 4000
                    }, endMarkerStyle));
                    marker._to = {
                        translate: {
                            x: +x,
                            y: +y
                        }
                    };
                } else {
                    marker.setAttributes({
                        value: '"' + xValue + ', ' + yValue + '"',
                        x: 0, y: 0,
                        hidden: false
                    }, true);
                    marker._to = {
                        translate: {
                            x: +x, 
                            y: +y
                        }
                    };
                }
            }
            me.items.push({
                series: me,
                value: [xValue, yValue],
                point: [x, y],
                sprite: marker,
                storeItem: store.getAt(storeIndices[i])
            });
            prevX = x;
            prevY = y;
        }

        if (path.length <= 1) {
            //nothing to be rendered
            return;
        }

        if (me.smooth) {
            smoothPath = Ext.draw.Draw.smooth(path, isNumber(smooth) ? smooth : me.defaultSmoothness);
        }

        renderPath = smooth ? smoothPath : path;

        //Correct path if we're animating timeAxis intervals
        if (chart.markerIndex && me.previousPath) {
            fromPath = me.previousPath;
            if (!smooth) {
                Ext.Array.erase(fromPath, 1, 2);
            }
        } else {
            fromPath = path;
        }

        // Only create a line if one doesn't exist.
        if (!me.line) {
            me.line = surface.add(Ext.apply({
                type: 'path',
                group: group,
                path: dummyPath,
                stroke: endLineStyle.stroke || endLineStyle.fill
            }, endLineStyle || {}));
            me

            //set configuration opacity
            me.line.setAttributes({
                opacity: lineOpacity
            }, true);

            if (enableShadows) {
                me.line.setAttributes(Ext.apply({}, me.shadowOptions), true);
            }

            //unset fill here (there's always a default fill withing the themes).
            me.line.setAttributes({
                fill: 'none',
                zIndex: 3000
            });
            if (!endLineStyle.stroke && colorArrayLength) {
                me.line.setAttributes({
                    stroke: colorArrayStyle[me.themeIdx % colorArrayLength]
                }, true);
            }
            if (enableShadows) {
                //create shadows
                shadows = me.line.shadows = [];
                for (shindex = 0; shindex < lnsh; shindex++) {
                    shadowBarAttr = shadowAttributes[shindex];
                    shadowBarAttr = Ext.apply({}, shadowBarAttr, { path: dummyPath });
                    shadow = surface.add(Ext.apply({}, {
                        type: 'path',
                        group: shadowGroups[shindex]
                    }, shadowBarAttr));
                    shadows.push(shadow);
                }
            }
        }
        if (me.fill) {
            fillPath = renderPath.concat([
                ["L", x, bbox.y + bbox.height],
                ["L", firstX, bbox.y + bbox.height],
                ["L", firstX, firstY]
            ]);
            if (!me.fillPath) {
                me.fillPath = surface.add({
                    group: group,
                    type: 'path',
                    fill: endLineStyle.fill || colorArrayStyle[me.themeIdx % colorArrayLength],
                    path: dummyPath
                });
            }
        }
        markerCount = showMarkers && markerGroup.getCount();
        if (chart.animate) {
            fill = me.fill;
            line = me.line;
            //Add renderer to line. There is not unique record associated with this.
            rendererAttributes = me.renderer(line, false, { path: renderPath }, i, store);
            Ext.apply(rendererAttributes, endLineStyle || {}, {
                stroke: endLineStyle.stroke || endLineStyle.fill
            });
            //fill should not be used here but when drawing the special fill path object
            delete rendererAttributes.fill;
            line.show(true);
            if (chart.markerIndex && me.previousPath) {
                me.animation = animation = me.onAnimate(line, {
                    to: rendererAttributes,
                    from: {
                        path: fromPath
                    }
                });
            } else {
                me.animation = animation = me.onAnimate(line, {
                    to: rendererAttributes
                });
            }
            //animate shadows
            if (enableShadows) {
                shadows = line.shadows;
                for(j = 0; j < lnsh; j++) {
                    shadows[j].show(true);
                    if (chart.markerIndex && me.previousPath) {
                        me.onAnimate(shadows[j], {
                            to: { path: renderPath },
                            from: { path: fromPath }
                        });
                    } else {
                        me.onAnimate(shadows[j], {
                            to: { path: renderPath }
                        });
                    }
                }
            }
            //animate fill path
            if (fill) {
                me.fillPath.show(true);
                me.onAnimate(me.fillPath, {
                    to: Ext.apply({}, {
                        path: fillPath,
                        fill: endLineStyle.fill || colorArrayStyle[me.themeIdx % colorArrayLength],
                        'stroke-width': 0,
                        opacity: fillOpacity
                    }, endLineStyle || {})
                });
            }
            //animate markers
            if (showMarkers) {
                count = 0;
                for(i = 0; i < ln; i++) {
                    if (me.items[i]) {
                        item = markerGroup.getAt(count++);
                        if (item) {
                            rendererAttributes = me.renderer(item, store.getAt(i), item._to, i, store);
                            me.onAnimate(item, {
                                to: Ext.applyIf(rendererAttributes, endMarkerStyle || {})
                            });
                            item.show(true);
                        }
                    }
                }
                for(; count < markerCount; count++) {
                    item = markerGroup.getAt(count);
                    item.hide(true);
                }
//                for(i = 0; i < (chart.markerIndex || 0)-1; i++) {
//                    item = markerGroup.getAt(i);
//                    item.hide(true);
//                }
            }
        } else {
            rendererAttributes = me.renderer(me.line, false, { path: renderPath, hidden: false }, i, store);
            Ext.apply(rendererAttributes, endLineStyle || {}, {
                stroke: endLineStyle.stroke || endLineStyle.fill
            });
            //fill should not be used here but when drawing the special fill path object
            delete rendererAttributes.fill;
            me.line.setAttributes(rendererAttributes, true);
            me.line.setAttributes({
                opacity: lineOpacity
            }, true);
            //set path for shadows
            if (enableShadows) {
                shadows = me.line.shadows;
                for(j = 0; j < lnsh; j++) {
                    shadows[j].setAttributes({
                        path: renderPath,
                        hidden: false
                    }, true);
                }
            }
            if (me.fill) {
                me.fillPath.setAttributes({
                    path: fillPath,
                    hidden: false,
                    opacity: fillOpacity
                }, true);
            }
            if (showMarkers) {
                count = 0;
                for(i = 0; i < ln; i++) {
                    if (me.items[i]) {
                        item = markerGroup.getAt(count++);
                        if (item) {
                            rendererAttributes = me.renderer(item, store.getAt(i), item._to, i, store);
                            item.setAttributes(Ext.apply(endMarkerStyle || {}, rendererAttributes || {}), true);
                            if (!item.attr.hidden) {
                                item.show(true);
                            }
                        }
                    }
                }
                for(; count < markerCount; count++) {
                    item = markerGroup.getAt(count);
                    item.hide(true);
                }
            }
        }

        if (chart.markerIndex) {
            if (me.smooth) {
                Ext.Array.erase(path, 1, 2);
            } else {
                Ext.Array.splice(path, 1, 0, path[1], path[2]);
            }
            me.previousPath = path;
        }
        me.renderLabels();
        me.renderCallouts();

        me.fireEvent('draw', me);
    },

    // @private called when a label is to be created.
    onCreateLabel: function(storeItem, item, i, display) {
        var me = this,
            group = me.labelsGroup,
            config = me.label,
            bbox = me.bbox,
            endLabelStyle = Ext.apply({}, config, me.seriesLabelStyle || {});

        return me.chart.surface.add(Ext.apply({
            'type': 'text',
            'text-anchor': 'middle',
            'group': group,
            'x': Number(item.point[0]),
            'y': bbox.y + bbox.height / 2
        }, endLabelStyle || {}));
    },

    // @private called when a label is to be positioned.
    onPlaceLabel: function(label, storeItem, item, i, display, animate, index) {
        var me = this,
            chart = me.chart,
            resizing = chart.resizing,
            config = me.label,
            format = config.renderer,
            field = config.field,
            bbox = me.bbox,
            x = Number(item.point[0]),
            y = Number(item.point[1]),
            radius = item.sprite.attr.radius,
            labelBox, markerBox, width, height, xOffset, yOffset;

        label.setAttributes({
            text: format(storeItem.get(field), label, storeItem, item, i, display, animate, index),
            hidden: true
        }, true);

        //TODO(nicolas): find out why width/height values in circle bounding boxes are undefined.
        markerBox = item.sprite.getBBox();
        markerBox.width = markerBox.width || (radius * 2);
        markerBox.height = markerBox.height || (radius * 2);

        labelBox = label.getBBox();
        width = labelBox.width/2;
        height = labelBox.height/2;

        if (display == 'rotate') {
            //correct label position to fit into the box
            xOffset = markerBox.width/2 + width + height/2;
            if (x + xOffset + width > bbox.x + bbox.width) {
                x -= xOffset;
            } else {
                x += xOffset;
            }
            label.setAttributes({
                'rotation': {
                    x: x,
                    y: y,
                    degrees: -45
                }
            }, true);
        } else if (display == 'under' || display == 'over') {
            label.setAttributes({
                'rotation': {
                    degrees: 0
                }
            }, true);

            //correct label position to fit into the box
            if (x < bbox.x + width) {
                x = bbox.x + width;
            } else if (x + width > bbox.x + bbox.width) {
                x = bbox.x + bbox.width - width;
            }

            yOffset = markerBox.height/2 + height;
            y = y + (display == 'over' ? -yOffset : yOffset);
            if (y < bbox.y + height) {
                y += 2 * yOffset;
            } else if (y + height > bbox.y + bbox.height) {
                y -= 2 * yOffset;
            }
        }

        if (me.chart.animate && !me.chart.resizing) {
            label.show(true);
            me.onAnimate(label, {
                to: {
                    x: x,
                    y: y
                }
            });
        } else {
            label.setAttributes({
                x: x,
                y: y
            }, true);
            if (resizing && me.animation) {
                me.animation.on('afteranimate', function() {
                    label.show(true);
                });
            } else {
                label.show(true);
            }
        }
    },

    // @private Overriding highlights.js highlightItem method.
    highlightItem: function() {
        var me = this,
            line = me.line;
                
        me.callParent(arguments);
        if (line && !me.highlighted) {
            if (!('__strokeWidth' in line)) {
                line.__strokeWidth = parseFloat(line.attr['stroke-width']) || 0;
            }
            if (line.__anim) {
                line.__anim.paused = true;
            }
            
            line.__anim = new Ext.fx.Anim({
                target: line,
                to: {
                    'stroke-width': line.__strokeWidth + 3
                }
            });
            me.highlighted = true;
        }
    },

    // @private Overriding highlights.js unHighlightItem method.
    unHighlightItem: function() {
        var me = this,
            line = me.line,
            width;
            
        me.callParent(arguments);
        if (line && me.highlighted) {
            width = line.__strokeWidth || parseFloat(line.attr['stroke-width']) || 0;
            line.__anim = new Ext.fx.Anim({
                target: line,
                to: {
                    'stroke-width': width
                }
            });
            me.highlighted = false;
        }
    },

    // @private called when a callout needs to be placed.
    onPlaceCallout : function(callout, storeItem, item, i, display, animate, index) {
        if (!display) {
            return;
        }

        var me = this,
            chart = me.chart,
            surface = chart.surface,
            resizing = chart.resizing,
            config = me.callouts,
            items = me.items,
            prev = i == 0? false : items[i -1].point,
            next = (i == items.length -1)? false : items[i +1].point,
            cur = [+item.point[0], +item.point[1]],
            dir, norm, normal, a, aprev, anext,
            offsetFromViz = config.offsetFromViz || 30,
            offsetToSide = config.offsetToSide || 10,
            offsetBox = config.offsetBox || 3,
            boxx, boxy, boxw, boxh,
            p, clipRect = me.clipRect,
            bbox = {
                width: config.styles.width || 10,
                height: config.styles.height || 10
            },
            x, y;

        //get the right two points
        if (!prev) {
            prev = cur;
        }
        if (!next) {
            next = cur;
        }
        a = (next[1] - prev[1]) / (next[0] - prev[0]);
        aprev = (cur[1] - prev[1]) / (cur[0] - prev[0]);
        anext = (next[1] - cur[1]) / (next[0] - cur[0]);

        norm = Math.sqrt(1 + a * a);
        dir = [1 / norm, a / norm];
        normal = [-dir[1], dir[0]];

        //keep the label always on the outer part of the "elbow"
        if (aprev > 0 && anext < 0 && normal[1] < 0
            || aprev < 0 && anext > 0 && normal[1] > 0) {
            normal[0] *= -1;
            normal[1] *= -1;
        } else if (Math.abs(aprev) < Math.abs(anext) && normal[0] < 0
                   || Math.abs(aprev) > Math.abs(anext) && normal[0] > 0) {
            normal[0] *= -1;
            normal[1] *= -1;
        }
        //position
        x = cur[0] + normal[0] * offsetFromViz;
        y = cur[1] + normal[1] * offsetFromViz;

        //box position and dimensions
        boxx = x + (normal[0] > 0? 0 : -(bbox.width + 2 * offsetBox));
        boxy = y - bbox.height /2 - offsetBox;
        boxw = bbox.width + 2 * offsetBox;
        boxh = bbox.height + 2 * offsetBox;

        //now check if we're out of bounds and invert the normal vector correspondingly
        //this may add new overlaps between labels (but labels won't be out of bounds).
        if (boxx < clipRect[0] || (boxx + boxw) > (clipRect[0] + clipRect[2])) {
            normal[0] *= -1;
        }
        if (boxy < clipRect[1] || (boxy + boxh) > (clipRect[1] + clipRect[3])) {
            normal[1] *= -1;
        }

        //update positions
        x = cur[0] + normal[0] * offsetFromViz;
        y = cur[1] + normal[1] * offsetFromViz;

        //update box position and dimensions
        boxx = x + (normal[0] > 0? 0 : -(bbox.width + 2 * offsetBox));
        boxy = y - bbox.height /2 - offsetBox;
        boxw = bbox.width + 2 * offsetBox;
        boxh = bbox.height + 2 * offsetBox;

        if (chart.animate) {
            //set the line from the middle of the pie to the box.
            me.onAnimate(callout.lines, {
                to: {
                    path: ["M", cur[0], cur[1], "L", x, y, "Z"]
                }
            });
            //set component position
            if (callout.panel) {
                callout.panel.setPosition(boxx, boxy, true);
            }
        }
        else {
            //set the line from the middle of the pie to the box.
            callout.lines.setAttributes({
                path: ["M", cur[0], cur[1], "L", x, y, "Z"]
            }, true);
            //set component position
            if (callout.panel) {
                callout.panel.setPosition(boxx, boxy);
            }
        }
        for (p in callout) {
            callout[p].show(true);
        }
    },

    isItemInPoint: function(x, y, item, i) {
        var me = this,
            items = me.items,
            tolerance = me.selectionTolerance,
            result = null,
            prevItem,
            nextItem,
            prevPoint,
            nextPoint,
            ln,
            x1,
            y1,
            x2,
            y2,
            xIntersect,
            yIntersect,
            dist1, dist2, dist, midx, midy,
            sqrt = Math.sqrt, abs = Math.abs;

        nextItem = items[i];
        prevItem = i && items[i - 1];

        if (i >= ln) {
            prevItem = items[ln - 1];
        }
        prevPoint = prevItem && prevItem.point;
        nextPoint = nextItem && nextItem.point;
        x1 = prevItem ? prevPoint[0] : nextPoint[0] - tolerance;
        y1 = prevItem ? prevPoint[1] : nextPoint[1];
        x2 = nextItem ? nextPoint[0] : prevPoint[0] + tolerance;
        y2 = nextItem ? nextPoint[1] : prevPoint[1];
        dist1 = sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
        dist2 = sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
        dist = Math.min(dist1, dist2);

        if (dist <= tolerance) {
            return dist == dist1? prevItem : nextItem;
        }
        return false;
    },

    // @private toggle visibility of all series elements (markers, sprites).
    toggleAll: function(show) {
        var me = this,
            i, ln, shadow, shadows;
        if (!show) {
            Ext.chart.series.Cartesian.prototype.hideAll.call(me);
        }
        else {
            Ext.chart.series.Cartesian.prototype.showAll.call(me);
        }
        if (me.line) {
            me.line.setAttributes({
                hidden: !show
            }, true);
            //hide shadows too
            if (me.line.shadows) {
                for (i = 0, shadows = me.line.shadows, ln = shadows.length; i < ln; i++) {
                    shadow = shadows[i];
                    shadow.setAttributes({
                        hidden: !show
                    }, true);
                }
            }
        }
        if (me.fillPath) {
            me.fillPath.setAttributes({
                hidden: !show
            }, true);
        }
    },

    // @private hide all series elements (markers, sprites).
    hideAll: function() {
        this.toggleAll(false);
    },

    // @private hide all series elements (markers, sprites).
    showAll: function() {
        this.toggleAll(true);
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
 * This layout allows you to easily render content into an HTML table. The total number of columns can be specified, and
 * rowspan and colspan can be used to create complex layouts within the table. This class is intended to be extended or
 * created via the `layout: {type: 'table'}` {@link Ext.container.Container#layout} config, and should generally not
 * need to be created directly via the new keyword.
 *
 * Note that when creating a layout via config, the layout-specific config properties must be passed in via the {@link
 * Ext.container.Container#layout} object which will then be applied internally to the layout. In the case of
 * TableLayout, the only valid layout config properties are {@link #columns} and {@link #tableAttrs}. However, the items
 * added to a TableLayout can supply the following table-specific config properties:
 *
 *   - **rowspan** Applied to the table cell containing the item.
 *   - **colspan** Applied to the table cell containing the item.
 *   - **cellId** An id applied to the table cell containing the item.
 *   - **cellCls** A CSS class name added to the table cell containing the item.
 *
 * The basic concept of building up a TableLayout is conceptually very similar to building up a standard HTML table. You
 * simply add each panel (or "cell") that you want to include along with any span attributes specified as the special
 * config properties of rowspan and colspan which work exactly like their HTML counterparts. Rather than explicitly
 * creating and nesting rows and columns as you would in HTML, you simply specify the total column count in the
 * layout config and start adding panels in their natural order from left to right, top to bottom. The layout will
 * automatically figure out, based on the column count, rowspans and colspans, how to position each panel within the
 * table. Just like with HTML tables, your rowspans and colspans must add up correctly in your overall layout or you'll
 * end up with missing and/or extra cells! Example usage:
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         title: 'Table Layout',
 *         width: 300,
 *         height: 150,
 *         layout: {
 *             type: 'table',
 *             // The total column count must be specified here
 *             columns: 3
 *         },
 *         defaults: {
 *             // applied to each contained panel
 *             bodyStyle: 'padding:20px'
 *         },
 *         items: [{
 *             html: 'Cell A content',
 *             rowspan: 2
 *         },{
 *             html: 'Cell B content',
 *             colspan: 2
 *         },{
 *             html: 'Cell C content',
 *             cellCls: 'highlight'
 *         },{
 *             html: 'Cell D content'
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 */
Ext.define('Ext.layout.container.Table', {

    /* Begin Definitions */

    alias: ['layout.table'],
    extend:  Ext.layout.container.Container ,
    alternateClassName: 'Ext.layout.TableLayout',

    /* End Definitions */

    /**
     * @cfg {Number} columns
     * The total number of columns to create in the table for this layout. If not specified, all Components added to
     * this layout will be rendered into a single row using one column per Component.
     */

    // private
    monitorResize:false,

    type: 'table',
    
    createsInnerCt: true,

    targetCls: Ext.baseCSSPrefix + 'table-layout-ct',
    tableCls: Ext.baseCSSPrefix + 'table-layout',
    cellCls: Ext.baseCSSPrefix + 'table-layout-cell',

    /**
     * @cfg {Object} tableAttrs
     * An object containing properties which are added to the {@link Ext.DomHelper DomHelper} specification used to
     * create the layout's `<table>` element. Example:
     *
     *     {
     *         xtype: 'panel',
     *         layout: {
     *             type: 'table',
     *             columns: 3,
     *             tableAttrs: {
     *                 style: {
     *                     width: '100%'
     *                 }
     *             }
     *         }
     *     }
     */
    tableAttrs: null,

    /**
     * @cfg {Object} trAttrs
     * An object containing properties which are added to the {@link Ext.DomHelper DomHelper} specification used to
     * create the layout's `<tr>` elements.
     */

    /**
     * @cfg {Object} tdAttrs
     * An object containing properties which are added to the {@link Ext.DomHelper DomHelper} specification used to
     * create the layout's `<td>` elements.
     */

    getItemSizePolicy: function (item) {
        return this.autoSizePolicy;
    },
    
    initHierarchyState: function (hierarchyStateInner) {    
        hierarchyStateInner.inShrinkWrapTable  = true;
    },

    getLayoutItems: function() {
        var me = this,
            result = [],
            items = me.callParent(),
            item,
            len = items.length, i;

        for (i = 0; i < len; i++) {
            item = items[i];
            if (!item.hidden) {
                result.push(item);
            }
        }
        return result;
    },
    
    getHiddenItems: function(){
        var result = [],
            items = this.owner.items.items,
            len = items.length,
            i = 0, item;
            
        for (; i < len; ++i) {
            item = items[i];
            if (item.rendered && item.hidden) {
                result.push(item);
            }
        }    
        return result;
    },

    /**
     * @private
     * Iterates over all passed items, ensuring they are rendered in a cell in the proper
     * location in the table structure.
     */
    renderChildren: function() {
        var me = this,
            items = me.getLayoutItems(),
            tbody = me.owner.getTargetEl().child('table', true).tBodies[0],
            rows = tbody.rows,
            i = 0,
            len = items.length,
            hiddenItems = me.getHiddenItems(),
            cells, curCell, rowIdx, cellIdx, item, trEl, tdEl, itemCt, el;

        // Calculate the correct cell structure for the current items
        cells = me.calculateCells(items);

        // Loop over each cell and compare to the current cells in the table, inserting/
        // removing/moving cells as needed, and making sure each item is rendered into
        // the correct cell.
        for (; i < len; i++) {
            curCell = cells[i];
            rowIdx = curCell.rowIdx;
            cellIdx = curCell.cellIdx;
            item = items[i];

            // If no row present, create and insert one
            trEl = rows[rowIdx];
            if (!trEl) {
                trEl = tbody.insertRow(rowIdx);
                if (me.trAttrs) {
                    trEl.set(me.trAttrs);
                }
            }

            // If no cell present, create and insert one
            itemCt = tdEl = Ext.get(trEl.cells[cellIdx] || trEl.insertCell(cellIdx));
            if (me.needsDivWrap()) { //create wrapper div if needed - see docs below
                itemCt = tdEl.first() || tdEl.createChild({tag: 'div'});
                itemCt.setWidth(null);
            }

            // Render or move the component into the cell
            if (!item.rendered) {
                me.renderItem(item, itemCt, 0);
            } else if (!me.isValidParent(item, itemCt, rowIdx, cellIdx, tbody)) {
                me.moveItem(item, itemCt, 0);
            }

            // Set the cell properties
            if (me.tdAttrs) {
                tdEl.set(me.tdAttrs);
            }
            if (item.tdAttrs) {
                tdEl.set(item.tdAttrs);
            }
            tdEl.set({
                colSpan: item.colspan || 1,
                rowSpan: item.rowspan || 1,
                id: item.cellId || '',
                cls: me.cellCls + ' ' + (item.cellCls || '')
            });

            // If at the end of a row, remove any extra cells
            if (!cells[i + 1] || cells[i + 1].rowIdx !== rowIdx) {
                cellIdx++;
                while (trEl.cells[cellIdx]) {
                    trEl.deleteCell(cellIdx);
                }
            }
        }

        // Delete any extra rows
        rowIdx++;
        while (tbody.rows[rowIdx]) {
            tbody.deleteRow(rowIdx);
        }
        
        // Check if we've removed any cells that contain a component, we need to move
        // them so they don't get cleaned up by the gc
        for (i = 0, len = hiddenItems.length; i < len; ++i) {
            me.ensureInDocument(hiddenItems[i].getEl());
        }
    },
    
    ensureInDocument: function(el){
        var dom = el.dom.parentNode;
        while (dom) {
            if (dom.tagName.toUpperCase() == 'BODY') {
                return;
            }
            dom = dom.parentNode;
        } 
        
        Ext.getDetachedBody().appendChild(el);
    },

    calculate: function (ownerContext) {
        if (!ownerContext.hasDomProp('containerChildrenSizeDone')) {
            this.done = false;
        } else {
            var targetContext = ownerContext.targetContext,
                widthShrinkWrap = ownerContext.widthModel.shrinkWrap,
                heightShrinkWrap = ownerContext.heightModel.shrinkWrap,
                shrinkWrap = heightShrinkWrap || widthShrinkWrap,
                table = shrinkWrap && targetContext.el.child('table', true),
                targetPadding = shrinkWrap && targetContext.getPaddingInfo();

            if (widthShrinkWrap) {
                ownerContext.setContentWidth(table.offsetWidth + targetPadding.width, true);
            }

            if (heightShrinkWrap) {
                ownerContext.setContentHeight(table.offsetHeight + targetPadding.height, true);
            }
        }
    },

    finalizeLayout: function() {
        if (this.needsDivWrap()) {
            // set wrapper div width to match layed out item - see docs below
            var items = this.getLayoutItems(),
                i,
                iLen  = items.length,
                item;

            for (i = 0; i < iLen; i++) {
                item = items[i];

                Ext.fly(item.el.dom.parentNode).setWidth(item.getWidth());
            }
        }
        if (Ext.isIE6 || Ext.isIEQuirks) {
            // Fixes an issue where the table won't paint
            this.owner.getTargetEl().child('table').repaint();
        }
    },

    /**
     * @private
     * Determine the row and cell indexes for each component, taking into consideration
     * the number of columns and each item's configured colspan/rowspan values.
     * @param {Array} items The layout components
     * @return {Object[]} List of row and cell indexes for each of the components
     */
    calculateCells: function(items) {
        var cells = [],
            rowIdx = 0,
            colIdx = 0,
            cellIdx = 0,
            totalCols = this.columns || Infinity,
            rowspans = [], //rolling list of active rowspans for each column
            i = 0, j,
            len = items.length,
            item;

        for (; i < len; i++) {
            item = items[i];

            // Find the first available row/col slot not taken up by a spanning cell
            while (colIdx >= totalCols || rowspans[colIdx] > 0) {
                if (colIdx >= totalCols) {
                    // move down to next row
                    colIdx = 0;
                    cellIdx = 0;
                    rowIdx++;

                    // decrement all rowspans
                    for (j = 0; j < totalCols; j++) {
                        if (rowspans[j] > 0) {
                            rowspans[j]--;
                        }
                    }
                } else {
                    colIdx++;
                }
            }

            // Add the cell info to the list
            cells.push({
                rowIdx: rowIdx,
                cellIdx: cellIdx
            });

            // Increment
            for (j = item.colspan || 1; j; --j) {
                rowspans[colIdx] = item.rowspan || 1;
                ++colIdx;
            }
            ++cellIdx;
        }

        return cells;
    },

    getRenderTree: function() {
        var me = this,
            items = me.getLayoutItems(),
            cells,
            rows = [],
            result = Ext.apply({
                tag: 'table',
                role: 'presentation',
                cls: me.tableCls,
                cellspacing: 0,
                cellpadding: 0,
                cn: {
                    tag: 'tbody',
                    cn: rows
                }
            }, me.tableAttrs),
            tdAttrs = me.tdAttrs,
            needsDivWrap = me.needsDivWrap(),
            i, len = items.length, item, curCell, tr, rowIdx, cellIdx, cell;

        // Calculate the correct cell structure for the current items
        cells = me.calculateCells(items);

        for (i = 0; i < len; i++) {
            item = items[i];
            
            curCell = cells[i];
            rowIdx = curCell.rowIdx;
            cellIdx = curCell.cellIdx;

            // If no row present, create and insert one
            tr = rows[rowIdx];
            if (!tr) {
                tr = rows[rowIdx] = {
                    tag: 'tr',
                    cn: []
                };
                if (me.trAttrs) {
                    Ext.apply(tr, me.trAttrs);
                }
            }

            // If no cell present, create and insert one
            cell = tr.cn[cellIdx] = {
                tag: 'td'
            };
            if (tdAttrs) {
                Ext.apply(cell, tdAttrs);
            }
            Ext.apply(cell, {
                colSpan: item.colspan || 1,
                rowSpan: item.rowspan || 1,
                id: item.cellId || '',
                cls: me.cellCls + ' ' + (item.cellCls || '')
            });

            if (needsDivWrap) { //create wrapper div if needed - see docs below
                cell = cell.cn = {
                    tag: 'div'
                };
            }

            me.configureItem(item);
            // The DomHelper config of the item is the cell's sole child
            cell.cn = item.getRenderTree();
        }
        return result;
    },

    isValidParent: function(item, target, rowIdx, cellIdx) {
        var tbody,
            correctCell,
            table;

        // If we were called with the 3 arg signature just check that the parent table of the item is within the render target
        if (arguments.length === 3) {
            table = item.el.up('table');
            return table && table.dom.parentNode === target.dom;
        }
        tbody = this.owner.getTargetEl().child('table', true).tBodies[0];
        correctCell = tbody.rows[rowIdx].cells[cellIdx];
        return item.el.dom.parentNode === correctCell;
    },

    /**
     * @private
     * Opera 10.5 has a bug where if a table cell's child has box-sizing:border-box and padding, it
     * will include that padding in the size of the cell, making it always larger than the
     * shrink-wrapped size of its contents. To get around this we have to wrap the contents in a div
     * and then set that div's width to match the item rendered within it afterLayout. This method
     * determines whether we need the wrapper div; it currently does a straight UA sniff as this bug
     * seems isolated to just Opera 10.5, but feature detection could be added here if needed.
     */
    needsDivWrap: function() {
        return Ext.isOpera10_5;
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
 * Small helper class to make creating {@link Ext.data.Store}s from JSON data easier.
 * A JsonStore will be automatically configured with a {@link Ext.data.reader.Json}.
 *
 * A store configuration would be something like:
 *
 *     var store = new Ext.data.JsonStore({
 *         // store configs
 *         storeId: 'myStore',
 *
 *         proxy: {
 *             type: 'ajax',
 *             url: 'get-images.php',
 *             reader: {
 *                 type: 'json',
 *                 root: 'images',
 *                 idProperty: 'name'
 *             }
 *         },
 *
 *         //alternatively, a {@link Ext.data.Model} name can be given (see {@link Ext.data.Store} for an example)
 *         fields: ['name', 'url', {name:'size', type: 'float'}, {name:'lastmod', type:'date'}]
 *     });
 *
 * This store is configured to consume a returned object of the form:
 *
 *     {
 *         images: [
 *             {name: 'Image one', url:'/GetImage.php?id=1', size:46.5, lastmod: new Date(2007, 10, 29)},
 *             {name: 'Image Two', url:'/GetImage.php?id=2', size:43.2, lastmod: new Date(2007, 10, 30)}
 *         ]
 *     }
 *
 * An object literal of this form could also be used as the {@link #cfg-data} config option.
 *
 * @author Ed Spencer
 */
Ext.define('Ext.data.JsonStore',  {
    extend:  Ext.data.Store ,
    alias: 'store.json',
               
                              
                               
                              
      

    constructor: function(config) {
        config = Ext.apply({
            proxy: {
                type  : 'ajax',
                reader: 'json',
                writer: 'json'
            }
        }, config);
        this.callParent([config]);
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
Ext.define('Ext.draw.Matrix', {

    /* Begin Definitions */

                                

    /* End Definitions */

    constructor: function(a, b, c, d, e, f) {
        if (a != null) {
            this.matrix = [[a, c, e], [b, d, f], [0, 0, 1]];
        }
        else {
            this.matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        }
    },

    add: function(a, b, c, d, e, f) {
        var me = this,
            out = [[], [], []],
            matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
            x,
            y,
            z,
            res;

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                res = 0;
                for (z = 0; z < 3; z++) {
                    res += me.matrix[x][z] * matrix[z][y];
                }
                out[x][y] = res;
            }
        }
        me.matrix = out;
    },

    prepend: function(a, b, c, d, e, f) {
        var me = this,
            out = [[], [], []],
            matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
            x,
            y,
            z,
            res;

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                res = 0;
                for (z = 0; z < 3; z++) {
                    res += matrix[x][z] * me.matrix[z][y];
                }
                out[x][y] = res;
            }
        }
        me.matrix = out;
    },

    invert: function() {
        var matrix = this.matrix,
            a = matrix[0][0],
            b = matrix[1][0],
            c = matrix[0][1],
            d = matrix[1][1],
            e = matrix[0][2],
            f = matrix[1][2],
            x = a * d - b * c;
        return new Ext.draw.Matrix(d / x, -b / x, -c / x, a / x, (c * f - d * e) / x, (b * e - a * f) / x);
    },

    clone: function() {
        var matrix = this.matrix,
            a = matrix[0][0],
            b = matrix[1][0],
            c = matrix[0][1],
            d = matrix[1][1],
            e = matrix[0][2],
            f = matrix[1][2];
        return new Ext.draw.Matrix(a, b, c, d, e, f);
    },

    translate: function(x, y) {
        this.prepend(1, 0, 0, 1, x, y);
    },

    scale: function(x, y, cx, cy) {
        var me = this;
        if (y == null) {
            y = x;
        }
        me.add(x, 0, 0, y, cx * (1 - x), cy * (1 - y));
    },

    rotate: function(a, x, y) {
        a = Ext.draw.Draw.rad(a);
        var me = this,
            cos = +Math.cos(a).toFixed(9),
            sin = +Math.sin(a).toFixed(9);
        me.add(cos, sin, -sin, cos, x - cos * x + sin * y, -(sin * x) + y - cos * y);
    },

    x: function(x, y) {
        var matrix = this.matrix;
        return x * matrix[0][0] + y * matrix[0][1] + matrix[0][2];
    },

    y: function(x, y) {
        var matrix = this.matrix;
        return x * matrix[1][0] + y * matrix[1][1] + matrix[1][2];
    },

    get: function(i, j) {
        return + this.matrix[i][j].toFixed(4);
    },

    toString: function() {
        var me = this;
        return [me.get(0, 0), me.get(0, 1), me.get(1, 0), me.get(1, 1), 0, 0].join();
    },

    toSvg: function() {
        var me = this;
        return "matrix(" + [me.get(0, 0), me.get(1, 0), me.get(0, 1), me.get(1, 1), me.get(0, 2), me.get(1, 2)].join() + ")";
    },

    toFilter: function(dx, dy) {
        var me = this;
        dx = dx || 0;
        dy = dy || 0;
        return "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', filterType='bilinear', M11=" + me.get(0, 0) +
            ", M12=" + me.get(0, 1) + ", M21=" + me.get(1, 0) + ", M22=" + me.get(1, 1) +
            ", Dx=" + (me.get(0, 2) + dx) + ", Dy=" + (me.get(1, 2) + dy) + ")";
    },

    offset: function() {
        var matrix = this.matrix;
        return [(matrix[0][2] || 0).toFixed(4), (matrix[1][2] || 0).toFixed(4)];
    },

    // Split matrix into Translate Scale, Shear, and Rotate
    split: function () {
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = Math.sqrt(norm(a));
            a[0] /= mag;
            a[1] /= mag;
        }
        var matrix = this.matrix,
            out = {
                translateX: matrix[0][2],
                translateY: matrix[1][2]
            },
            row;

        // scale and shear
        row = [[matrix[0][0], matrix[0][1]], [matrix[1][1], matrix[1][1]]];
        out.scaleX = Math.sqrt(norm(row[0]));
        normalize(row[0]);

        out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
        row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

        out.scaleY = Math.sqrt(norm(row[1]));
        normalize(row[1]);
        out.shear /= out.scaleY;

        // rotation
        out.rotate = Math.asin(-row[0][1]);

        out.isSimple = !+out.shear.toFixed(9) && (out.scaleX.toFixed(9) == out.scaleY.toFixed(9) || !out.rotate);

        return out;
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
 * DD implementation for Panels.
 * @private
 */
Ext.define('Ext.draw.SpriteDD', {
    extend:  Ext.dd.DragSource ,

    constructor : function(sprite, cfg){
        var me = this,
            el = sprite.el;
        me.sprite = sprite;
        me.el = el;
        me.dragData = {el: el, sprite: sprite};
        me.callParent([el, cfg]);
        me.sprite.setStyle('cursor', 'move');
    },

    showFrame: Ext.emptyFn,
    createFrame : Ext.emptyFn,

    getDragEl : function(e){
        return this.el;
    },
    
    getRegion: function() {
        var me = this,
            el = me.el,
            pos, x1, x2, y1, y2, t, r, b, l, bbox, sprite;
        
        sprite = me.sprite;
        bbox = sprite.getBBox();
        
        try {
            pos = Ext.Element.getXY(el);
        } catch (e) { }

        if (!pos) {
            return null;
        }

        x1 = pos[0];
        x2 = x1 + bbox.width;
        y1 = pos[1];
        y2 = y1 + bbox.height;
        
        return new Ext.util.Region(y1, x2, y2, x1);
    },

    /*
      TODO(nico): Cumulative translations in VML are handled
      differently than in SVG. While in SVG we specify the translation
      relative to the original x, y position attributes, in VML the translation
      is a delta between the last position of the object (modified by the last
      translation) and the new one.
      
      In VML the translation alters the position
      of the object, we should change that or alter the SVG impl.
    */
     
    startDrag: function(x, y) {
        var me = this,
            attr = me.sprite.attr;
        me.prev = me.sprite.surface.transformToViewBox(x, y);
    },

    onDrag: function(e) {
        var xy = e.getXY(),
            me = this,
            sprite = me.sprite,
            attr = sprite.attr, dx, dy;
        xy = me.sprite.surface.transformToViewBox(xy[0], xy[1]);
        dx = xy[0] - me.prev[0];
        dy = xy[1] - me.prev[1];
        sprite.setAttributes({
            translate: {
                x: attr.translation.x + dx,
                y: attr.translation.y + dy
            }
        }, true);
        me.prev = xy;
    },

    setDragElPos: function () {
        // Disable automatic DOM move in DD that spoils layout of VML engine.
        return false;
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
 * A Sprite is an object rendered in a Drawing surface.
 *
 * ## Types
 *
 * The following sprite types are supported:
 *
 * ### Rect
 *
 * Rectangle requires `width` and `height` attributes:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: 'rect',
 *             width: 100,
 *             height: 50,
 *             radius: 10,
 *             fill: 'green',
 *             opacity: 0.5,
 *             stroke: 'red',
 *             'stroke-width': 2
 *         }]
 *     });
 *
 * ### Circle
 *
 * Circle requires `x`, `y` and `radius` attributes:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: 'circle',
 *             radius: 90,
 *             x: 100,
 *             y: 100,
 *             fill: 'blue'
 *         }]
 *     });
 *
 * ### Ellipse
 *
 * Ellipse requires `x`, `y`, `radiusX` and `radiusY` attributes:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: "ellipse",
 *             radiusX: 100,
 *             radiusY: 50,
 *             x: 100,
 *             y: 100,
 *             fill: 'red'
 *         }]
 *     });
 *
 * ### Path
 *
 * Path requires the `path` attribute:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: "path",
 *             path: "M-66.6 26C-66.6 26 -75 22 -78.2 18.4C-81.4 14.8 -80.948 19.966 " +
 *                   "-85.8 19.6C-91.647 19.159 -90.6 3.2 -90.6 3.2L-94.6 10.8C-94.6 " +
 *                   "10.8 -95.8 25.2 -87.8 22.8C-83.893 21.628 -82.6 23.2 -84.2 " +
 *                   "24C-85.8 24.8 -78.6 25.2 -81.4 26.8C-84.2 28.4 -69.8 23.2 -72.2 " +
 *                   "33.6L-66.6 26z",
 *             fill: "purple"
 *         }]
 *     });
 *
 * ### Text
 *
 * Text requires the `text` attribute:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: "text",
 *             text: "Hello, Sprite!",
 *             fill: "green",
 *             font: "18px monospace"
 *         }]
 *     });
 *
 * ### Image
 *
 * Image requires `width`, `height` and `src` attributes:
 *
 *     @example
 *     Ext.create('Ext.draw.Component', {
 *         renderTo: Ext.getBody(),
 *         width: 200,
 *         height: 200,
 *         items: [{
 *             type: "image",
 *             src: "http://www.sencha.com/img/apple-touch-icon.png",
 *             width: 200,
 *             height: 200
 *         }]
 *     });
 *
 * ## Creating and adding a Sprite to a Surface
 *
 * See {@link Ext.draw.Surface} documentation.
 *
 * ## Transforming sprites
 *
 * See {@link #setAttributes} method documentation for examples on how to translate, scale and rotate the sprites.
 *
 */
Ext.define('Ext.draw.Sprite', {

    /* Begin Definitions */

    mixins: {
        observable:  Ext.util.Observable ,
        animate:  Ext.util.Animate 
    },

                                    

    /* End Definitions */

    /**
     * @cfg {String} type The type of the sprite.
     * Possible options are 'circle', 'ellipse', 'path', 'rect', 'text', 'image'.
     *
     * See {@link Ext.draw.Sprite} class documentation for examples of all types.
     */

    /**
     * @cfg {Number} width The width of the rect or image sprite.
     */

    /**
     * @cfg {Number} height The height of the rect or image sprite.
     */

    /**
     * @cfg {Number} radius The radius of the circle sprite. Or in case of rect sprite, the border radius.
     */

    /**
     * @cfg {Number} radiusX The radius of the ellipse sprite along x-axis.
     */

    /**
     * @cfg {Number} radiusY The radius of the ellipse sprite along y-axis.
     */

    /**
     * @cfg {Number} x Sprite position along the x-axis.
     */

    /**
     * @cfg {Number} y Sprite position along the y-axis.
     */

    /**
     * @cfg {String} path The path of the path sprite written in SVG-like path syntax.
     */

    /**
     * @cfg {Number} opacity The opacity of the sprite. A number between 0 and 1.
     */

    /**
     * @cfg {String} fill The fill color.
     */

    /**
     * @cfg {String} stroke The stroke color.
     */

    /**
     * @cfg {Number} stroke-width The width of the stroke.
     *
     * Note that this attribute needs to be quoted when used.  Like so:
     *
     *     "stroke-width": 12,
     */

    /**
     * @cfg {String} font Used with text type sprites. The full font description.
     * Uses the same syntax as the CSS font parameter
     */

    /**
     * @cfg {String} text The actual text to render in text sprites.
     */

    /**
     * @cfg {String} src Path to the image to show in image sprites.
     */

    /**
     * @cfg {String/String[]} group The group that this sprite belongs to, or an array of groups.
     * Only relevant when added to a {@link Ext.draw.Surface Surface}.
     */

    /**
     * @cfg {Boolean} draggable True to make the sprite draggable.
     */

    dirty: false,
    dirtyHidden: false,
    dirtyTransform: false,
    dirtyPath: true,
    dirtyFont: true,
    zIndexDirty: true,

    /**
     * @property {Boolean} isSprite
     * `true` in this class to identify an object as an instantiated Sprite, or subclass thereof.
     */
    isSprite: true,
    zIndex: 0,
    fontProperties: [
        'font',
        'font-size',
        'font-weight',
        'font-style',
        'font-family',
        'text-anchor',
        'text'
    ],
    pathProperties: [
        'x',
        'y',
        'd',
        'path',
        'height',
        'width',
        'radius',
        'r',
        'rx',
        'ry',
        'cx',
        'cy'
    ],
    constructor: function(config) {
        var me = this;
        config = Ext.merge({}, config || {});
        me.id = Ext.id(null, 'ext-sprite-');
        me.transformations = [];
        Ext.copyTo(this, config, 'surface,group,type,draggable');
        //attribute bucket
        me.bbox = {};
        me.attr = {
            zIndex: 0,
            translation: {
                x: null,
                y: null
            },
            rotation: {
                degrees: null,
                x: null,
                y: null
            },
            scaling: {
                x: null,
                y: null,
                cx: null,
                cy: null
            }
        };
        //delete not bucket attributes
        delete config.surface;
        delete config.group;
        delete config.type;
        delete config.draggable;
        me.setAttributes(config);
        me.addEvents(
            /**
             * @event
             * Fires before the sprite is destroyed. Return false from an event handler to stop the destroy.
             * @param {Ext.draw.Sprite} this
             */
            'beforedestroy',
            /**
             * @event
             * Fires after the sprite is destroyed.
             * @param {Ext.draw.Sprite} this
             */
            'destroy',
            /**
             * @event
             * Fires after the sprite markup is rendered.
             * @param {Ext.draw.Sprite} this
             */
            'render',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#mousedown
             */
            'mousedown',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#mouseup
             */
            'mouseup',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#mouseover
             */
            'mouseover',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#mouseout
             */
            'mouseout',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#mousemove
             */
            'mousemove',
            /**
             * @event
             * @inheritdoc Ext.dom.Element#click
             */
            'click'
        );
        me.mixins.observable.constructor.apply(this, arguments);
    },

    /**
     * @property {Ext.dd.DragSource} dd
     * If this Sprite is configured {@link #draggable}, this property will contain
     * an instance of {@link Ext.dd.DragSource} which handles dragging the Sprite.
     *
     * The developer must provide implementations of the abstract methods of {@link Ext.dd.DragSource}
     * in order to supply behaviour for each stage of the drag/drop process. See {@link #draggable}.
     */

    initDraggable: function() {
        var me = this;
        //create element if it doesn't exist.
        if (!me.el) {
            me.surface.createSpriteElement(me);
        }
        me.dd = new Ext.draw.SpriteDD(me, Ext.isBoolean(me.draggable) ? null : me.draggable);
        me.on('beforedestroy', me.dd.destroy, me.dd);
    },

    /**
     * Change the attributes of the sprite.
     *
     * ## Translation
     *
     * For translate, the configuration object contains x and y attributes that indicate where to
     * translate the object. For example:
     *
     *     sprite.setAttributes({
     *       translate: {
     *        x: 10,
     *        y: 10
     *       }
     *     }, true);
     *
     *
     * ## Rotation
     *
     * For rotation, the configuration object contains x and y attributes for the center of the rotation (which are optional),
     * and a `degrees` attribute that specifies the rotation in degrees. For example:
     *
     *     sprite.setAttributes({
     *       rotate: {
     *        degrees: 90
     *       }
     *     }, true);
     *
     * That example will create a 90 degrees rotation using the centroid of the Sprite as center of rotation, whereas:
     *
     *     sprite.setAttributes({
     *       rotate: {
     *        x: 0,
     *        y: 0,
     *        degrees: 90
     *       }
     *     }, true);
     *
     * will create a rotation around the `(0, 0)` axis.
     *
     *
     * ## Scaling
     *
     * For scaling, the configuration object contains x and y attributes for the x-axis and y-axis scaling. For example:
     *
     *     sprite.setAttributes({
     *       scale: {
     *        x: 10,
     *        y: 3
     *       }
     *     }, true);
     *
     * You can also specify the center of scaling by adding `cx` and `cy` as properties:
     *
     *     sprite.setAttributes({
     *       scale: {
     *        cx: 0,
     *        cy: 0,
     *        x: 10,
     *        y: 3
     *       }
     *     }, true);
     *
     * That last example will scale a sprite taking as centers of scaling the `(0, 0)` coordinate.
     *
     * @param {Object} attrs attributes to be changed on the sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.Sprite} this
     */
    setAttributes: function(attrs, redraw) {
        var me = this,
            fontProps = me.fontProperties,
            fontPropsLength = fontProps.length,
            pathProps = me.pathProperties,
            pathPropsLength = pathProps.length,
            hasSurface = !!me.surface,
            custom = hasSurface && me.surface.customAttributes || {},
            spriteAttrs = me.attr,
            dirtyBBox = false,
            attr, i, newTranslation, translation, newRotate, rotation, newScaling, scaling;

        attrs = Ext.apply({}, attrs);
        for (attr in custom) {
            if (attrs.hasOwnProperty(attr) && typeof custom[attr] == "function") {
                Ext.apply(attrs, custom[attr].apply(me, [].concat(attrs[attr])));
            }
        }

        // Flag a change in hidden
        if (!!attrs.hidden !== !!spriteAttrs.hidden) {
            me.dirtyHidden = true;
        }

        // Flag path change
        for (i = 0; i < pathPropsLength; i++) {
            attr = pathProps[i];
            if (attr in attrs && attrs[attr] !== spriteAttrs[attr]) {
                me.dirtyPath = true;
                dirtyBBox = true;
                break;
            }
        }

        // Flag zIndex change
        if ('zIndex' in attrs) {
            me.zIndexDirty = true;
        }

        // Flag font/text change
        if ('text' in attrs) {
            me.dirtyFont = true;
            dirtyBBox = true;
        }

        for (i = 0; i < fontPropsLength; i++) {
            attr = fontProps[i];
            if (attr in attrs && attrs[attr] !== spriteAttrs[attr]) {
                me.dirtyFont = true;
                dirtyBBox = true;
                break;
            }
        }

        newTranslation = attrs.translation || attrs.translate;
        delete attrs.translate;
        delete attrs.translation;
        translation = spriteAttrs.translation;
        if (newTranslation) {
            if (('x' in newTranslation && newTranslation.x !== translation.x) ||
                ('y' in newTranslation && newTranslation.y !== translation.y)) {
                me.dirtyTransform = true;
                translation.x = newTranslation.x;
                translation.y = newTranslation.y;
            }
        }

        newRotate = attrs.rotation || attrs.rotate;
        rotation = spriteAttrs.rotation;
        delete attrs.rotate;
        delete attrs.rotation;
        if (newRotate) {
            if (('x' in newRotate && newRotate.x !== rotation.x) ||
                ('y' in newRotate && newRotate.y !== rotation.y) ||
                ('degrees' in newRotate && newRotate.degrees !== rotation.degrees)) {
                me.dirtyTransform = true;
                rotation.x = newRotate.x;
                rotation.y = newRotate.y;
                rotation.degrees = newRotate.degrees;
            }
        }

        newScaling = attrs.scaling || attrs.scale;
        scaling = spriteAttrs.scaling;
        delete attrs.scale;
        delete attrs.scaling;
        if (newScaling) {
            if (('x' in newScaling && newScaling.x !== scaling.x) ||
                ('y' in newScaling && newScaling.y !== scaling.y) ||
                ('cx' in newScaling && newScaling.cx !== scaling.cx) ||
                ('cy' in newScaling && newScaling.cy !== scaling.cy)) {
                me.dirtyTransform = true;
                scaling.x = newScaling.x;
                scaling.y = newScaling.y;
                scaling.cx = newScaling.cx;
                scaling.cy = newScaling.cy;
            }
        }

        // If the bbox is changed, then the bbox based transforms should be invalidated.
        if (!me.dirtyTransform && dirtyBBox) {
            if (spriteAttrs.scaling.x === null ||
                spriteAttrs.scaling.y === null ||
                spriteAttrs.rotation.y === null ||
                spriteAttrs.rotation.y === null) {
                me.dirtyTransform = true;
            }
        }

        Ext.apply(spriteAttrs, attrs);
        me.dirty = true;

        if (redraw === true && hasSurface) {
            me.redraw();
        }
        return this;
    },

    /**
     * Retrieves the bounding box of the sprite.
     * This will be returned as an object with x, y, width, and height properties.
     * @return {Object} bbox
     */
    getBBox: function() {
        return this.surface.getBBox(this);
    },

    setText: function(text) {
        return this.surface.setText(this, text);
    },

    /**
     * Hides the sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.Sprite} this
     */
    hide: function(redraw) {
        this.setAttributes({
            hidden: true
        }, redraw);
        return this;
    },

    /**
     * Shows the sprite.
     * @param {Boolean} redraw Flag to immediately draw the change.
     * @return {Ext.draw.Sprite} this
     */
    show: function(redraw) {
        this.setAttributes({
            hidden: false
        }, redraw);
        return this;
    },

    /**
     * Removes the sprite.
     * @return {Boolean} True if sprite was successfully removed.
     * False when there was no surface to remove it from.
     */
    remove: function() {
        if (this.surface) {
            this.surface.remove(this);
            return true;
        }
        return false;
    },

    onRemove: function() {
        this.surface.onRemove(this);
    },

    /**
     * Removes the sprite and clears all listeners.
     */
    destroy: function() {
        var me = this;
        if (me.fireEvent('beforedestroy', me) !== false) {
            me.remove();
            me.surface.onDestroy(me);
            me.clearListeners();
            me.fireEvent('destroy');
        }
    },

    /**
     * Redraws the sprite.
     * @return {Ext.draw.Sprite} this
     */
    redraw: function() {
        this.surface.renderItem(this);
        return this;
    },

    /**
     * Wrapper for setting style properties, also takes single object parameter of multiple styles.
     * @param {String/Object} property The style property to be set, or an object of multiple styles.
     * @param {String} value (optional) The value to apply to the given property, or null if an object was passed.
     * @return {Ext.draw.Sprite} this
     */
    setStyle: function() {
        this.el.setStyle.apply(this.el, arguments);
        return this;
    },

    /**
     * Adds one or more CSS classes to the element. Duplicate classes are automatically filtered out.  Note this method
     * is severly limited in VML.
     * @param {String/String[]} className The CSS class to add, or an array of classes
     * @return {Ext.draw.Sprite} this
     */
    addCls: function(obj) {
        this.surface.addCls(this, obj);
        return this;
    },

    /**
     * Removes one or more CSS classes from the element.
     * @param {String/String[]} className The CSS class to remove, or an array of classes.  Note this method
     * is severly limited in VML.
     * @return {Ext.draw.Sprite} this
     */
    removeCls: function(obj) {
        this.surface.removeCls(this, obj);
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
 * Exports a {@link Ext.draw.Surface Surface} to an image. To do this,
 * the svg string must be sent to a remote server and processed.
 *
 * # Sending the data
 *
 * A post request is made to the URL. The following fields are sent:
 *
 * + width: The width of the image
 * + height: The height of the image
 * + type: The image type to save as, see {@link #supportedTypes}
 * + svg: The svg string for the surface
 *
 * # The response
 *
 * It is expected that the user will be prompted with an image download.
 * As such, the following options should be set on the server:
 *
 * + Content-Disposition: 'attachment, filename="chart.png"'
 * + Content-Type: 'image/png'
 *
 * **Important**: By default, chart data is sent to a server operated
 * by Sencha to do data processing. You may change this default by
 * setting the {@link #defaultUrl} of this class.
 * In addition, please note that this service only creates PNG images.
 */
Ext.define('Ext.draw.engine.ImageExporter', {
    singleton: true,

    /**
     * @property {String} [defaultUrl="http://svg.sencha.io"]
     * The default URL to submit the form request.
     */
    defaultUrl: 'http://svg.sencha.io',

    /**
     * @property {Array} [supportedTypes=["image/png", "image/jpeg"]]
     * A list of export types supported by the server
     */
    supportedTypes: ['image/png', 'image/jpeg'],

    /**
     * @property {String} [widthParam="width"]
     * The name of the width parameter to be sent to the server.
     * The Sencha IO server expects it to be the default value.
     */
    widthParam: 'width',

    /**
     * @property {String} [heightParam="height"]
     * The name of the height parameter to be sent to the server.
     * The Sencha IO server expects it to be the default value.
     */
    heightParam: 'height',

    /**
     * @property {String} [typeParam="type"]
     * The name of the type parameter to be sent to the server.
     * The Sencha IO server expects it to be the default value.
     */
    typeParam: 'type',

    /**
     * @property {String} [svgParam="svg"]
     * The name of the svg parameter to be sent to the server.
     * The Sencha IO server expects it to be the default value.
     */
    svgParam: 'svg',

    formCls: Ext.baseCSSPrefix + 'hide-display',

    /**
     * Exports the surface to an image
     * @param {Ext.draw.Surface} surface The surface to export
     * @param {Object} [config] The following config options are supported:
     *
     * @param {Number} config.width A width to send to the server to for
     * configuring the image height
     *
     * @param {Number} config.height A height to send to the server for
     * configuring the image height
     *
     * @param {String} config.url The url to post the data to. Defaults to
     * the {@link #defaultUrl} configuration on the class.
     *
     * @param {String} config.type The type of image to export. See the
     * {@link #supportedTypes}
     *
     * @param {String} config.widthParam The name of the width parameter to send
     * to the server. Defaults to {@link #widthParam}
     *
     * @param {String} config.heightParam The name of the height parameter to send
     * to the server. Defaults to {@link #heightParam}
     *
     * @param {String} config.typeParam The name of the type parameter to send
     * to the server. Defaults to {@link #typeParam}
     *
     * @param {String} config.svgParam The name of the svg parameter to send
     * to the server. Defaults to {@link #svgParam}
     *
     * @return {Boolean} True if the surface was successfully sent to the server.
     */
    generate: function(surface, config) {
        config = config || {};
        var me = this,
            type = config.type,
            form;

        if (Ext.Array.indexOf(me.supportedTypes, type) === -1) {
            return false;
        }

        form = Ext.getBody().createChild({
            tag: 'form',
            method: 'POST',
            action: config.url || me.defaultUrl,
            cls: me.formCls,
            children: [{
                tag: 'input',
                type: 'hidden',
                name: config.widthParam || me.widthParam,
                value: config.width || surface.width
            }, {
                tag: 'input',
                type: 'hidden',
                name: config.heightParam || me.heightParam,
                value: config.height || surface.height
            }, {
                tag: 'input',
                type: 'hidden',
                name: config.typeParam || me.typeParam,
                value: type
            }, {
                tag: 'input',
                type: 'hidden',
                name: config.svgParam || me.svgParam
            }]
        });

        // Assign the data on the value so it doesn't get messed up in the html insertion
        form.last(null, true).value = Ext.draw.engine.SvgExporter.generate(surface);

        form.dom.submit();
        form.remove();
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
 * Provides specific methods to draw with SVG.
 */
Ext.define('Ext.draw.engine.Svg', {

    /* Begin Definitions */

    extend:  Ext.draw.Surface ,

                                                                                     

    /* End Definitions */

    engine: 'Svg',

    trimRe: /^\s+|\s+$/g,
    spacesRe: /\s+/,
    xlink: "http:/" + "/www.w3.org/1999/xlink",

    translateAttrs: {
        radius: "r",
        radiusX: "rx",
        radiusY: "ry",
        path: "d",
        lineWidth: "stroke-width",
        fillOpacity: "fill-opacity",
        strokeOpacity: "stroke-opacity",
        strokeLinejoin: "stroke-linejoin"
    },

    parsers: {},

    minDefaults: {
        circle: {
            cx: 0,
            cy: 0,
            r: 0,
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        ellipse: {
            cx: 0,
            cy: 0,
            rx: 0,
            ry: 0,
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        rect: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rx: 0,
            ry: 0,
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        text: {
            x: 0,
            y: 0,
            "text-anchor": "start",
            "font-family": null,
            "font-size": null,
            "font-weight": null,
            "font-style": null,
            fill: "#000",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        path: {
            d: "M0,0",
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        image: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            preserveAspectRatio: "none",
            opacity: null
        }
    },

    createSvgElement: function(type, attrs) {
        var el = this.domRef.createElementNS("http:/" + "/www.w3.org/2000/svg", type),
            key;
        if (attrs) {
            for (key in attrs) {
                el.setAttribute(key, String(attrs[key]));
            }
        }
        return el;
    },

    createSpriteElement: function(sprite) {
        // Create svg element and append to the DOM.
        var el = this.createSvgElement(sprite.type);
        el.id = sprite.id;
        if (el.style) {
            el.style.webkitTapHighlightColor = "rgba(0,0,0,0)";
        }
        sprite.el = Ext.get(el);
        this.applyZIndex(sprite); //performs the insertion
        sprite.matrix = new Ext.draw.Matrix();
        sprite.bbox = {
            plain: 0,
            transform: 0
        };
        this.applyAttrs(sprite);
        this.applyTransformations(sprite);
        sprite.fireEvent("render", sprite);
        return el;
    },
    
    getBBoxText: function (sprite) {
        var bbox = {},
            bb, height, width, i, ln, el;

        if (sprite && sprite.el) {
            el = sprite.el.dom;
            try {
                bbox = el.getBBox();
                return bbox;
            } catch(e) {
                // Firefox 3.0.x plays badly here
            }
            bbox = {x: bbox.x, y: Infinity, width: 0, height: 0};
            ln = el.getNumberOfChars();
            for (i = 0; i < ln; i++) {
                bb = el.getExtentOfChar(i);
                bbox.y = Math.min(bb.y, bbox.y);
                height = bb.y + bb.height - bbox.y;
                bbox.height = Math.max(bbox.height, height);
                width = bb.x + bb.width - bbox.x;
                bbox.width = Math.max(bbox.width, width);
            }
            return bbox;
        }
    },

    hide: function() {
        Ext.get(this.el).hide();
    },

    show: function() {
        Ext.get(this.el).show();
    },

    hidePrim: function(sprite) {
        this.addCls(sprite, Ext.baseCSSPrefix + 'hide-visibility');
    },

    showPrim: function(sprite) {
        this.removeCls(sprite, Ext.baseCSSPrefix + 'hide-visibility');
    },

    getDefs: function() {
        return this._defs || (this._defs = this.createSvgElement("defs"));
    },

    transform: function(sprite, matrixOnly) {
        var me = this,
            matrix = new Ext.draw.Matrix(),
            transforms = sprite.transformations,
            transformsLength = transforms.length,
            i = 0,
            transform, type;
            
        for (; i < transformsLength; i++) {
            transform = transforms[i];
            type = transform.type;
            if (type == "translate") {
                matrix.translate(transform.x, transform.y);
            }
            else if (type == "rotate") {
                matrix.rotate(transform.degrees, transform.x, transform.y);
            }
            else if (type == "scale") {
                matrix.scale(transform.x, transform.y, transform.centerX, transform.centerY);
            }
        }
        sprite.matrix = matrix;
        if (!matrixOnly) {
            sprite.el.set({transform: matrix.toSvg()});
        }
    },

    setSize: function(width, height) {
        var me = this,
            el = me.el;
        
        width = +width || me.width;
        height = +height || me.height;
        me.width = width;
        me.height = height;

        el.setSize(width, height);
        el.set({
            width: width,
            height: height
        });
        me.callParent([width, height]);
    },

    /**
     * Get the region for the surface's canvas area
     * @returns {Ext.util.Region}
     */
    getRegion: function() {
        // Mozilla requires using the background rect because the svg element returns an
        // incorrect region. Webkit gives no region for the rect and must use the svg element.
        var svgXY = this.el.getXY(),
            rectXY = this.bgRect.getXY(),
            max = Math.max,
            x = max(svgXY[0], rectXY[0]),
            y = max(svgXY[1], rectXY[1]);
        return {
            left: x,
            top: y,
            right: x + this.width,
            bottom: y + this.height
        };
    },

    onRemove: function(sprite) {
        if (sprite.el) {
            sprite.el.destroy();
            delete sprite.el;
        }
        this.callParent(arguments);
    },
    
    setViewBox: function(x, y, width, height) {
        if (isFinite(x) && isFinite(y) && isFinite(width) && isFinite(height)) {
            this.callParent(arguments);
            this.el.dom.setAttribute("viewBox", [x, y, width, height].join(" "));
        }
    },

    render: function (container) {
        var me = this,
            width,
            height,
            el,
            defs,
            bgRect,
            webkitRect;
        if (!me.el) {
            width = me.width || 0;
            height = me.height || 0;
            el = me.createSvgElement('svg', {
                xmlns: "http:/" + "/www.w3.org/2000/svg",
                version: 1.1,
                width: width,
                height: height
            });
            defs = me.getDefs();

            // Create a rect that is always the same size as the svg root; this serves 2 purposes:
            // (1) It allows mouse events to be fired over empty areas in Webkit, and (2) we can
            // use it rather than the svg element for retrieving the correct client rect of the
            // surface in Mozilla (see https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
            bgRect = me.createSvgElement("rect", {
                width: "100%",
                height: "100%",
                fill: "#000",
                stroke: "none",
                opacity: 0
            });
            
            if (Ext.isSafari3) {
                // Rect that we will show/hide to fix old WebKit bug with rendering issues.
                webkitRect = me.createSvgElement("rect", {
                    x: -10,
                    y: -10,
                    width: "110%",
                    height: "110%",
                    fill: "none",
                    stroke: "#000"
                });
            }
            el.appendChild(defs);
            if (Ext.isSafari3) {
                el.appendChild(webkitRect);
            }
            el.appendChild(bgRect);
            container.appendChild(el);
            me.el = Ext.get(el);
            me.bgRect = Ext.get(bgRect);
            if (Ext.isSafari3) {
                me.webkitRect = Ext.get(webkitRect);
                me.webkitRect.hide();
            }
            me.el.on({
                scope: me,
                mouseup: me.onMouseUp,
                mousedown: me.onMouseDown,
                mouseover: me.onMouseOver,
                mouseout: me.onMouseOut,
                mousemove: me.onMouseMove,
                mouseenter: me.onMouseEnter,
                mouseleave: me.onMouseLeave,
                click: me.onClick,
                dblclick: me.onDblClick
            });
        }
        me.renderAll();
    },

    // private
    onMouseEnter: function(e) {
        if (this.el.parent().getRegion().contains(e.getPoint())) {
            this.fireEvent('mouseenter', e);
        }
    },

    // private
    onMouseLeave: function(e) {
        if (!this.el.parent().getRegion().contains(e.getPoint())) {
            this.fireEvent('mouseleave', e);
        }
    },
    // @private - Normalize a delegated single event from the main container to each sprite and sprite group
    processEvent: function(name, e) {
        var target = e.getTarget(),
            surface = this.surface,
            sprite;

        this.fireEvent(name, e);
        // We wrap text types in a tspan, sprite is the parent.
        if (target.nodeName == "tspan" && target.parentNode) {
            target = target.parentNode;
        }
        sprite = this.items.get(target.id);
        if (sprite) {
            sprite.fireEvent(name, sprite, e);
        }
    },

    /* @private - Wrap SVG text inside a tspan to allow for line wrapping.  In addition this normallizes
     * the baseline for text the vertical middle of the text to be the same as VML.
     */
    tuneText: function (sprite, attrs) {
        var el = sprite.el.dom,
            tspans = [],
            height, tspan, text, i, ln, texts, factor, x;

        if (attrs.hasOwnProperty("text")) {
            //only create new tspans for text lines if the text has been 
            //updated or if it's the first time we're setting the text
            //into the sprite.

            //get the actual rendered text.
            text = sprite.tspans && Ext.Array.map(sprite.tspans, function(t) { return t.textContent; }).join('');

            if (!sprite.tspans || attrs.text != text) {
                tspans = this.setText(sprite, attrs.text);
                sprite.tspans = tspans;
            //for all other cases reuse the tspans previously created.
            } else {
                tspans = sprite.tspans || [];
            }
        }
        // Normalize baseline via a DY shift of first tspan. Shift other rows by height * line height (1.2)
        if (tspans.length) {
            height = this.getBBoxText(sprite).height;
            x = sprite.el.dom.getAttribute("x");
            for (i = 0, ln = tspans.length; i < ln; i++) {
                // The text baseline for FireFox 3.0 and 3.5 is different than other SVG implementations
                // so we are going to normalize that here
                factor = (Ext.isFF3_0 || Ext.isFF3_5) ? 2 : 4;
                tspans[i].setAttribute("x", x);
                tspans[i].setAttribute("dy", i ? height * 1.2 : height / factor);
            }
            sprite.dirty = true;
        }
    },

    setText: function(sprite, textString) {
         var me = this,
             el = sprite.el.dom,
             tspans = [],
             height, tspan, text, i, ln, texts;
        
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        // Wrap each row into tspan to emulate rows
        texts = String(textString).split("\n");
        for (i = 0, ln = texts.length; i < ln; i++) {
            text = texts[i];
            if (text) {
                tspan = me.createSvgElement("tspan");
                tspan.appendChild(document.createTextNode(Ext.htmlDecode(text)));
                el.appendChild(tspan);
                tspans[i] = tspan;
            }
        }
        return tspans;
    },

    renderAll: function() {
        this.items.each(this.renderItem, this);
    },

    renderItem: function (sprite) {
        if (!this.el) {
            return;
        }
        if (!sprite.el) {
            this.createSpriteElement(sprite);
        }
        if (sprite.zIndexDirty) {
            this.applyZIndex(sprite);
        }
        if (sprite.dirty) {
            this.applyAttrs(sprite);
            if (sprite.dirtyTransform) {
                this.applyTransformations(sprite);
            }
        }
    },

    redraw: function(sprite) {
        sprite.dirty = sprite.zIndexDirty = true;
        this.renderItem(sprite);
    },

    applyAttrs: function (sprite) {
        var me = this,
            el = sprite.el,
            group = sprite.group,
            sattr = sprite.attr,
            parsers = me.parsers,
            //Safari does not handle linear gradients correctly in quirksmode
            //ref: https://bugs.webkit.org/show_bug.cgi?id=41952
            //ref: EXTJSIV-1472
            gradientsMap = me.gradientsMap || {},
            safariFix = Ext.isSafari && !Ext.isStrict,
            groups, i, ln, attrs, font, key, style, name, rect;

        if (group) {
            groups = [].concat(group);
            ln = groups.length;
            for (i = 0; i < ln; i++) {
                group = groups[i];
                me.getGroup(group).add(sprite);
            }
            delete sprite.group;
        }
        attrs = me.scrubAttrs(sprite) || {};

        // if (sprite.dirtyPath) {
            sprite.bbox.plain = 0;
            sprite.bbox.transform = 0;
            if (sprite.type == "circle" || sprite.type == "ellipse") {
                attrs.cx = attrs.cx || attrs.x;
                attrs.cy = attrs.cy || attrs.y;
            }
            else if (sprite.type == "rect") {
                attrs.rx = attrs.ry = attrs.r;
            }
            else if (sprite.type == "path" && attrs.d) {
                attrs.d = Ext.draw.Draw.pathToString(Ext.draw.Draw.pathToAbsolute(attrs.d));
            }
            sprite.dirtyPath = false;
        // }
        // else {
        //     delete attrs.d;
        // }

        if (attrs['clip-rect']) {
            me.setClip(sprite, attrs);
            delete attrs['clip-rect'];
        }
        if (sprite.type == 'text' && attrs.font && sprite.dirtyFont) {
            el.set({ style: "font: " + attrs.font});
        }
        if (sprite.type == "image") {
            el.dom.setAttributeNS(me.xlink, "href", attrs.src);
        }
        Ext.applyIf(attrs, me.minDefaults[sprite.type]);

        if (sprite.dirtyHidden) {
            (sattr.hidden) ? me.hidePrim(sprite) : me.showPrim(sprite);
            sprite.dirtyHidden = false;
        }
        for (key in attrs) {
            if (attrs.hasOwnProperty(key) && attrs[key] != null) {
                //Safari does not handle linear gradients correctly in quirksmode
                //ref: https://bugs.webkit.org/show_bug.cgi?id=41952
                //ref: EXTJSIV-1472
                //if we're Safari in QuirksMode and we're applying some color attribute and the value of that
                //attribute is a reference to a gradient then assign a plain color to that value instead of the gradient.
                if (safariFix && ('color|stroke|fill'.indexOf(key) > -1) && (attrs[key] in gradientsMap)) {
                    attrs[key] = gradientsMap[attrs[key]];
                }
                //hidden is not a proper SVG attribute.
                if (key == 'hidden' && sprite.type == 'text') {
                    continue;
                }
                if (key in parsers) {
                    el.dom.setAttribute(key, parsers[key](attrs[key], sprite, me));
                } else {
                    el.dom.setAttribute(key, attrs[key]);
                }
            }
        }
        
        if (sprite.type == 'text') {
            me.tuneText(sprite, attrs);
        }
        sprite.dirtyFont = false;

        //set styles
        style = sattr.style;
        if (style) {
            el.setStyle(style);
        }

        sprite.dirty = false;

        if (Ext.isSafari3) {
            // Refreshing the view to fix bug EXTJSIV-1: rendering issue in old Safari 3
            me.webkitRect.show();
            setTimeout(function () {
                me.webkitRect.hide();
            });
        }
    },

    setClip: function(sprite, params) {
        var me = this,
            rect = params["clip-rect"],
            clipEl, clipPath;
        if (rect) {
            if (sprite.clip) {
                sprite.clip.parentNode.parentNode.removeChild(sprite.clip.parentNode);
            }
            clipEl = me.createSvgElement('clipPath');
            clipPath = me.createSvgElement('rect');
            clipEl.id = Ext.id(null, 'ext-clip-');
            clipPath.setAttribute("x", rect.x);
            clipPath.setAttribute("y", rect.y);
            clipPath.setAttribute("width", rect.width);
            clipPath.setAttribute("height", rect.height);
            clipEl.appendChild(clipPath);
            me.getDefs().appendChild(clipEl);
            sprite.el.dom.setAttribute("clip-path", "url(#" + clipEl.id + ")");
            sprite.clip = clipPath;
        } 
        // if (!attrs[key]) {
        //     var clip = Ext.getDoc().dom.getElementById(sprite.el.getAttribute("clip-path").replace(/(^url\(#|\)$)/g, ""));
        //     clip && clip.parentNode.removeChild(clip);
        //     sprite.el.setAttribute("clip-path", "");
        //     delete attrss.clip;
        // }
    },

    /**
     * Insert or move a given sprite's element to the correct place in the DOM list for its zIndex
     * @param {Ext.draw.Sprite} sprite
     */
    applyZIndex: function(sprite) {
        var me = this,
            items = me.items,
            idx = items.indexOf(sprite),
            el = sprite.el,
            prevEl;
        if (me.el.dom.childNodes[idx + 2] !== el.dom) { //shift by 2 to account for defs and bg rect
            if (idx > 0) {
                // Find the first previous sprite which has its DOM element created already
                do {
                    prevEl = items.getAt(--idx).el;
                } while (!prevEl && idx > 0);
            }
            el.insertAfter(prevEl || me.bgRect);
        }
        sprite.zIndexDirty = false;
    },

    createItem: function (config) {
        var sprite = new Ext.draw.Sprite(config);
        sprite.surface = this;
        return sprite;
    },

    addGradient: function(gradient) {
        gradient = Ext.draw.Draw.parseGradient(gradient);
        var me = this,
            ln = gradient.stops.length,
            vector = gradient.vector,
            //Safari does not handle linear gradients correctly in quirksmode
            //ref: https://bugs.webkit.org/show_bug.cgi?id=41952
            //ref: EXTJSIV-1472
            usePlain = Ext.isSafari && !Ext.isStrict,
            gradientEl, stop, stopEl, i, gradientsMap;
            
        gradientsMap = me.gradientsMap || {};
        
        if (!usePlain) {
            if (gradient.type == "linear") {
                gradientEl = me.createSvgElement("linearGradient");
                gradientEl.setAttribute("x1", vector[0]);
                gradientEl.setAttribute("y1", vector[1]);
                gradientEl.setAttribute("x2", vector[2]);
                gradientEl.setAttribute("y2", vector[3]);
            }
            else {
                gradientEl = me.createSvgElement("radialGradient");
                gradientEl.setAttribute("cx", gradient.centerX);
                gradientEl.setAttribute("cy", gradient.centerY);
                gradientEl.setAttribute("r", gradient.radius);
                if (Ext.isNumber(gradient.focalX) && Ext.isNumber(gradient.focalY)) {
                    gradientEl.setAttribute("fx", gradient.focalX);
                    gradientEl.setAttribute("fy", gradient.focalY);
                }
            }
            gradientEl.id = gradient.id;
            me.getDefs().appendChild(gradientEl);
            for (i = 0; i < ln; i++) {
                stop = gradient.stops[i];
                stopEl = me.createSvgElement("stop");
                stopEl.setAttribute("offset", stop.offset + "%");
                stopEl.setAttribute("stop-color", stop.color);
                stopEl.setAttribute("stop-opacity",stop.opacity);
                gradientEl.appendChild(stopEl);
            }
        } else {
            gradientsMap['url(#' + gradient.id + ')'] = gradient.stops[0].color;
        }
        me.gradientsMap = gradientsMap;
    },

    /**
     * Checks if the specified CSS class exists on this element's DOM node.
     * @param {Ext.draw.Sprite} sprite The sprite to look into.
     * @param {String} className The CSS class to check for
     * @return {Boolean} True if the class exists, else false
     */
    hasCls: function(sprite, className) {
        return className && (' ' + (sprite.el.dom.getAttribute('class') || '') + ' ').indexOf(' ' + className + ' ') != -1;
    },

    addCls: function(sprite, className) {
        var el = sprite.el,
            i,
            len,
            v,
            cls = [],
            curCls =  el.getAttribute('class') || '';
        // Separate case is for speed
        if (!Ext.isArray(className)) {
            if (typeof className == 'string' && !this.hasCls(sprite, className)) {
                el.set({ 'class': curCls + ' ' + className });
            }
        }
        else {
            for (i = 0, len = className.length; i < len; i++) {
                v = className[i];
                if (typeof v == 'string' && (' ' + curCls + ' ').indexOf(' ' + v + ' ') == -1) {
                    cls.push(v);
                }
            }
            if (cls.length) {
                el.set({ 'class': ' ' + cls.join(' ') });
            }
        }
    },

    removeCls: function(sprite, className) {
        var me = this,
            el = sprite.el,
            curCls =  el.getAttribute('class') || '',
            i, idx, len, cls, elClasses;
        if (!Ext.isArray(className)){
            className = [className];
        }
        if (curCls) {
            elClasses = curCls.replace(me.trimRe, ' ').split(me.spacesRe);
            for (i = 0, len = className.length; i < len; i++) {
                cls = className[i];
                if (typeof cls == 'string') {
                    cls = cls.replace(me.trimRe, '');
                    idx = Ext.Array.indexOf(elClasses, cls);
                    if (idx != -1) {
                        Ext.Array.erase(elClasses, idx, 1);
                    }
                }
            }
            el.set({ 'class': elClasses.join(' ') });
        }
    },

    destroy: function() {
        var me = this;
        
        me.callParent();
        if (me.el) {
            me.el.remove();
        }
        if (me._defs) {
            Ext.get(me._defs).destroy();
        }
        if (me.bgRect) {
            Ext.get(me.bgRect).destroy();
        }
        if (me.webkitRect) {
            Ext.get(me.webkitRect).destroy();
        }
        delete me.el;
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
 * A utility class for exporting a {@link Ext.draw.Surface Surface} to a string
 * that may be saved or used for processing on the server.
 *
 * @singleton
 */
Ext.define('Ext.draw.engine.SvgExporter', function(){
   var commaRe = /,/g,
       fontRegex = /(-?\d*\.?\d*){1}(em|ex|px|in|cm|mm|pt|pc|%)\s('*.*'*)/,
       rgbColorRe = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
       rgbaColorRe = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,([\d\.]+)\)/g,
       surface, len, width, height,

   init = function(s){
       surface = s;
       len = surface.length;
       width = surface.width;
       height = surface.height;
   },
   spriteProcessor = {
       path: function(sprite){

           var attr = sprite.attr,
               path = attr.path,
               pathString = '',
               props, p, pLen;

           if (Ext.isArray(path[0])) {
               pLen = path.length;
               for (p = 0; p < pLen; p++) {
                   pathString += path[p].join(' ');
               }
           } else if (Ext.isArray(path)) {
               pathString = path.join(' ');
           } else {
               pathString = path.replace(commaRe,' ');
           }

           props = toPropertyString({
               d: pathString,
               fill: attr.fill || 'none',
               stroke: attr.stroke,
               'fill-opacity': attr.opacity,
               'stroke-width': attr['stroke-width'],
               'stroke-opacity': attr['stroke-opacity'],
               "z-index": attr.zIndex,
               transform: sprite.matrix.toSvg()
           });

           return '<path ' + props + '/>';
       },
       text: function(sprite){

           // TODO
           // implement multi line support (@see Svg.js tuneText)

           var attr = sprite.attr,
               match = fontRegex.exec(attr.font),
               size = (match && match[1]) || "12",
               // default font family is Arial
               family = (match && match[3]) || 'Arial',
               text = attr.text,
               factor = (Ext.isFF3_0 || Ext.isFF3_5) ? 2 : 4,
               tspanString = '',
               props;

           sprite.getBBox();
           tspanString += '<tspan x="' + (attr.x || '') + '" dy="';
           tspanString += (size/factor)+'">';
           tspanString += Ext.htmlEncode(text) + '</tspan>';


           props = toPropertyString({
               x: attr.x,
               y: attr.y,
               'font-size': size,
               'font-family': family,
               'font-weight': attr['font-weight'],
               'text-anchor': attr['text-anchor'],
               // if no fill property is set it will be black
               fill: attr.fill || '#000',
               'fill-opacity': attr.opacity,
               transform: sprite.matrix.toSvg()
           });



           return '<text '+ props + '>' +  tspanString + '</text>';
       },
       rect: function(sprite){

           var attr = sprite.attr,
               props =  toPropertyString({
                   x: attr.x,
                   y: attr.y,
                   rx: attr.rx,
                   ry: attr.ry,
                   width: attr.width,
                   height: attr.height,
                   fill: attr.fill || 'none',
                   'fill-opacity': attr.opacity,
                   stroke: attr.stroke,
                   'stroke-opacity': attr['stroke-opacity'],
                   'stroke-width':attr['stroke-width'],
                   transform: sprite.matrix && sprite.matrix.toSvg()
               });

           return '<rect ' + props + '/>';
       },
       circle: function(sprite){

           var attr = sprite.attr,
               props = toPropertyString({
                   cx: attr.x,
                   cy: attr.y,
                   r: attr.radius,
                   fill: attr.translation.fill || attr.fill || 'none',
                   'fill-opacity': attr.opacity,
                   stroke: attr.stroke,
                   'stroke-opacity': attr['stroke-opacity'],
                   'stroke-width':attr['stroke-width'],
                   transform: sprite.matrix.toSvg()
               });

           return '<circle ' + props + ' />';
       },
       image: function(sprite){

           var attr = sprite.attr,
               props = toPropertyString({
                   x: attr.x - (attr.width/2 >> 0),
                   y: attr.y - (attr.height/2 >> 0),
                   width: attr.width,
                   height: attr.height,
                   'xlink:href': attr.src,
                   transform: sprite.matrix.toSvg()
               });

           return '<image ' + props + ' />';
       }
   },
   svgHeader = function(){
       var svg = '<?xml version="1.0" standalone="yes"?>';
       svg += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
       return svg;
   },
   svgContent = function(){
       var svg = '<svg width="'+width+'px" height="'+height+'px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">',
           defs = '', item, itemsLen, items, gradient,
           getSvgString, colorstops, stop,
           coll, keys, colls, k, kLen, key, collI, i, j, stopsLen, sortedItems, za, zb;

       items = surface.items.items;
       itemsLen = items.length;


       getSvgString = function(node){

           var childs = node.childNodes,
               childLength = childs.length,
               i = 0,
               attrLength,
               j,
               svgString = '', child, attr, tagName, attrItem;

               for(; i < childLength; i++){
                   child = childs[i];
                   attr = child.attributes;
                   tagName = child.tagName;

                   svgString += '<' +tagName;

                   for(j = 0, attrLength = attr.length; j < attrLength; j++){
                       attrItem = attr.item(j);
                       svgString += ' '+attrItem.name+'="'+attrItem.value+'"';
                   }

                   svgString += '>';

                   if(child.childNodes.length > 0){
                       svgString += getSvgString(child);
                   }

                   svgString += '</' + tagName + '>';

               }
           return svgString;
       };


       if(surface.getDefs){
           defs = getSvgString(surface.getDefs());
       }else{
           // IE
           coll = surface.gradientsColl;
           if (coll) {
               keys  = coll.keys;
               colls = coll.items;
               k     = 0;
               kLen  = keys.length;
           }

           for (; k < kLen; k++) {
               key   = keys[k];
               collI = colls[k];

               gradient = surface.gradientsColl.getByKey(key);
               defs += '<linearGradient id="' + key + '" x1="0" y1="0" x2="1" y2="1">';

               var color = gradient.colors.replace(rgbColorRe, 'rgb($1|$2|$3)');
               color = color.replace(rgbaColorRe, 'rgba($1|$2|$3|$4)')
               colorstops = color.split(',');
               for(i=0, stopsLen = colorstops.length; i < stopsLen; i++){
                   stop = colorstops[i].split(' ');
                   color = Ext.draw.Color.fromString(stop[1].replace(/\|/g,','));
                   defs += '<stop offset="'+stop[0]+'" stop-color="' + color.toString() + '" stop-opacity="1"></stop>';
               }
               defs += '</linearGradient>';
           }
       }

       svg += '<defs>' + defs + '</defs>';

       // thats the background rectangle
       svg += spriteProcessor.rect({
           attr: {
                   width: '100%',
                   height: '100%',
                   fill: '#fff',
                   stroke: 'none',
                   opacity: '0'
           }
       });

       // Sort the items (stable sort guaranteed)
       sortedItems = new Array(itemsLen);
       for(i = 0; i < itemsLen; i++){
           sortedItems[i] = i;
       }
       sortedItems.sort(function (a, b) {
           za = items[a].attr.zIndex || 0;
           zb = items[b].attr.zIndex || 0;
           if (za == zb) {
               return a - b;
           }
           return za - zb;
       });

       for(i = 0; i < itemsLen; i++){
           item = items[sortedItems[i]];
           if(!item.attr.hidden){
               svg += spriteProcessor[item.type](item);
           }
       }

       svg += '</svg>';

       return svg;
   },
   toPropertyString = function(obj){
       var propString = '',
           key;

       for(key in obj){

           if(obj.hasOwnProperty(key) && obj[key] != null){
               propString += key +'="'+ obj[key]+'" ';
           }

       }

       return propString;
   };

   return {
       singleton: true,

       /**
        * Exports the passed surface to a SVG string representation
        * @param {Ext.draw.Surface} surface The surface to export
        * @param {Object} [config] Any configuration for the export. Currently this is
        * unused but may provide more options in the future
        * @return {String} The SVG as a string
        */
       generate: function(surface, config){
           config = config || {};
           init(surface);
           return svgHeader() + svgContent();
       }
   };
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
 * Provides specific methods to draw with VML.
 */
Ext.define('Ext.draw.engine.Vml', {

    /* Begin Definitions */

    extend:  Ext.draw.Surface ,

                                                                                                       

    /* End Definitions */

    engine: 'Vml',

    map: {M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x"},
    bitesRe: /([clmz]),?([^clmz]*)/gi,
    valRe: /-?[^,\s\-]+/g,
    fillUrlRe: /^url\(\s*['"]?([^\)]+?)['"]?\s*\)$/i,
    pathlike: /^(path|rect)$/,
    NonVmlPathRe: /[ahqstv]/ig, // Non-VML Pathing ops
    partialPathRe: /[clmz]/g,
    fontFamilyRe: /^['"]+|['"]+$/g,
    baseVmlCls: Ext.baseCSSPrefix + 'vml-base',
    vmlGroupCls: Ext.baseCSSPrefix + 'vml-group',
    spriteCls: Ext.baseCSSPrefix + 'vml-sprite',
    measureSpanCls: Ext.baseCSSPrefix + 'vml-measure-span',
    zoom: 21600,
    coordsize: 1000,
    coordorigin: '0 0',
    zIndexShift: 0,
    // VML uses CSS z-index and therefore doesn't need sprites to be kept in zIndex order
    orderSpritesByZIndex: false,

    // @private
    // Convert an SVG standard path into a VML path
    path2vml: function (path) {
        var me = this,
            nonVML = me.NonVmlPathRe,
            map = me.map,
            val = me.valRe,
            zoom = me.zoom,
            bites = me.bitesRe,
            command = Ext.Function.bind(Ext.draw.Draw.pathToAbsolute, Ext.draw.Draw),
            res, pa, p, r, i, ii, j, jj;
        if (String(path).match(nonVML)) {
            command = Ext.Function.bind(Ext.draw.Draw.path2curve, Ext.draw.Draw);
        } else if (!String(path).match(me.partialPathRe)) {
            res = String(path).replace(bites, function (all, command, args) {
                var vals = [],
                    isMove = command.toLowerCase() == "m",
                    res = map[command];
                args.replace(val, function (value) {
                    if (isMove && vals.length === 2) {
                        res += vals + map[command == "m" ? "l" : "L"];
                        vals = [];
                    }
                    vals.push(Math.round(value * zoom));
                });
                return res + vals;
            });
            return res;
        }
        pa = command(path);
        res = [];
        for (i = 0, ii = pa.length; i < ii; i++) {
            p = pa[i];
            r = pa[i][0].toLowerCase();
            if (r == "z") {
                r = "x";
            }
            for (j = 1, jj = p.length; j < jj; j++) {
                r += Math.round(p[j] * me.zoom) + (j != jj - 1 ? "," : "");
            }
            res.push(r);
        }
        return res.join(" ");
    },

    // @private - set of attributes which need to be translated from the sprite API to the native browser API
    translateAttrs: {
        radius: "r",
        radiusX: "rx",
        radiusY: "ry",
        lineWidth: "stroke-width",
        fillOpacity: "fill-opacity",
        strokeOpacity: "stroke-opacity",
        strokeLinejoin: "stroke-linejoin"
    },

    // @private - Minimun set of defaults for different types of sprites.
    minDefaults: {
        circle: {
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        ellipse: {
            cx: 0,
            cy: 0,
            rx: 0,
            ry: 0,
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        rect: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rx: 0,
            ry: 0,
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        text: {
            x: 0,
            y: 0,
            "text-anchor": "start",
            font: '10px "Arial"',
            fill: "#000",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        path: {
            d: "M0,0",
            fill: "none",
            stroke: null,
            "stroke-width": null,
            opacity: null,
            "fill-opacity": null,
            "stroke-opacity": null
        },
        image: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            preserveAspectRatio: "none",
            opacity: null
        }
    },

    // private
    onMouseEnter: function (e) {
        this.fireEvent("mouseenter", e);
    },

    // private
    onMouseLeave: function (e) {
        this.fireEvent("mouseleave", e);
    },

    // @private - Normalize a delegated single event from the main container to each sprite and sprite group
    processEvent: function (name, e) {
        var target = e.getTarget(),
            surface = this.surface,
            sprite;
        this.fireEvent(name, e);
        sprite = this.items.get(target.id);
        if (sprite) {
            sprite.fireEvent(name, sprite, e);
        }
    },

    // Create the VML element/elements and append them to the DOM
    createSpriteElement: function (sprite) {
        var me = this,
            attr = sprite.attr,
            type = sprite.type,
            zoom = me.zoom,
            vml = sprite.vml || (sprite.vml = {}),
            round = Math.round,
            el = (type === 'image') ? me.createNode('image') : me.createNode('shape'),
            path, skew, textPath;

        el.coordsize = zoom + ' ' + zoom;
        el.coordorigin = attr.coordorigin || "0 0";
        Ext.get(el).addCls(me.spriteCls);
        if (type == "text") {
            vml.path = path = me.createNode("path");
            path.textpathok = true;
            vml.textpath = textPath = me.createNode("textpath");
            textPath.on = true;
            el.appendChild(textPath);
            el.appendChild(path);
        }
        el.id = sprite.id;
        sprite.el = Ext.get(el);
        sprite.el.setStyle('zIndex', -me.zIndexShift);
        me.el.appendChild(el);
        if (type !== 'image') {
            skew = me.createNode("skew");
            skew.on = true;
            el.appendChild(skew);
            sprite.skew = skew;
        }
        sprite.matrix = new Ext.draw.Matrix();
        sprite.bbox = {
            plain: null,
            transform: null
        };

        this.applyAttrs(sprite);
        this.applyTransformations(sprite);        
        sprite.fireEvent("render", sprite);
        return sprite.el;
    },

    getBBoxText: function (sprite) {
        var vml = sprite.vml;
        return {
            x: vml.X + (vml.bbx || 0) - vml.W / 2,
            y: vml.Y - vml.H / 2,
            width: vml.W,
            height: vml.H
        };
    },

    applyAttrs: function (sprite) {
        var me = this,
            vml = sprite.vml,
            group = sprite.group,
            spriteAttr = sprite.attr,
            el = sprite.el,
            dom = el.dom,
            style, name, groups, i, ln, scrubbedAttrs, font, key,
            cx, cy, rx, ry;

        if (group) {
            groups = [].concat(group);
            ln = groups.length;
            for (i = 0; i < ln; i++) {
                group = groups[i];
                me.getGroup(group).add(sprite);
            }
            delete sprite.group;
        }
        scrubbedAttrs = me.scrubAttrs(sprite) || {};

        if (sprite.zIndexDirty) {
            me.setZIndex(sprite);
        }

        // Apply minimum default attributes
        Ext.applyIf(scrubbedAttrs, me.minDefaults[sprite.type]);

        if (sprite.type == 'image') {
            Ext.apply(sprite.attr, {
                x: scrubbedAttrs.x,
                y: scrubbedAttrs.y,
                width: scrubbedAttrs.width,
                height: scrubbedAttrs.height
            });
            el.setStyle({
                width: scrubbedAttrs.width + 'px',
                height: scrubbedAttrs.height + 'px'
            });
            dom.src = scrubbedAttrs.src;
        }

        if (dom.href) {
            dom.href = scrubbedAttrs.href;
        }
        if (dom.title) {
            dom.title = scrubbedAttrs.title;
        }
        if (dom.target) {
            dom.target = scrubbedAttrs.target;
        }
        if (dom.cursor) {
            dom.cursor = scrubbedAttrs.cursor;
        }

        // Change visibility
        if (sprite.dirtyHidden) {
            (scrubbedAttrs.hidden) ? me.hidePrim(sprite) : me.showPrim(sprite);
            sprite.dirtyHidden = false;
        }

        // Update path
        if (sprite.dirtyPath) {
            if (sprite.type == "circle" || sprite.type == "ellipse") {
                cx = scrubbedAttrs.x;
                cy = scrubbedAttrs.y;
                rx = scrubbedAttrs.rx || scrubbedAttrs.r || 0;
                ry = scrubbedAttrs.ry || scrubbedAttrs.r || 0;
                dom.path = Ext.String.format("ar{0},{1},{2},{3},{4},{1},{4},{1}",
                    Math.round((cx - rx) * me.zoom),
                    Math.round((cy - ry) * me.zoom),
                    Math.round((cx + rx) * me.zoom),
                    Math.round((cy + ry) * me.zoom),
                    Math.round(cx * me.zoom));
                sprite.dirtyPath = false;
            }
            else if (sprite.type !== "text" && sprite.type !== 'image') {
                sprite.attr.path = scrubbedAttrs.path = me.setPaths(sprite, scrubbedAttrs) || scrubbedAttrs.path;
                dom.path = me.path2vml(scrubbedAttrs.path);
                sprite.dirtyPath = false;
            }
        }

        // Apply clipping
        if ("clip-rect" in scrubbedAttrs) {
            me.setClip(sprite, scrubbedAttrs);
        }

        // Handle text (special handling required)
        if (sprite.type == "text") {
            me.setTextAttributes(sprite, scrubbedAttrs);
        }

        // Handle fill and opacity
        if (scrubbedAttrs.opacity || scrubbedAttrs['stroke-opacity'] || scrubbedAttrs.fill) {
            me.setFill(sprite, scrubbedAttrs);
        }

        // Handle stroke (all fills require a stroke element)
        if (scrubbedAttrs.stroke || scrubbedAttrs['stroke-opacity'] || scrubbedAttrs.fill) {
            me.setStroke(sprite, scrubbedAttrs);
        }

        //set styles
        style = spriteAttr.style;
        if (style) {
            el.setStyle(style);
        }

        sprite.dirty = false;
    },

    setZIndex: function (sprite) {
        var me = this,
            zIndex = sprite.attr.zIndex,
            shift = me.zIndexShift,
            items, iLen, item, i;

        if (zIndex < shift) {
            // This means bad thing happened.
            // The algorithm below will guarantee O(n) time.
            items = me.items.items;
            iLen = items.length;

            for (i = 0; i < iLen; i++) {
                if ((zIndex = items[i].attr.zIndex) && zIndex < shift) { // zIndex is no longer useful this case
                    shift = zIndex;
                }
            }

            me.zIndexShift = shift;
            for (i = 0; i < iLen; i++) {
                item = items[i];
                if (item.el) {
                    item.el.setStyle('zIndex', item.attr.zIndex - shift);
                }
                item.zIndexDirty = false;
            }
        } else if (sprite.el) {
            sprite.el.setStyle('zIndex', zIndex - shift);
            sprite.zIndexDirty = false;
        }
    },

    // Normalize all virtualized types into paths.
    setPaths: function (sprite, params) {
        var spriteAttr = sprite.attr, thickness = sprite.attr['stroke-width'] || 1;
        // Clear bbox cache
        sprite.bbox.plain = null;
        sprite.bbox.transform = null;
        if (sprite.type == 'circle') {
            spriteAttr.rx = spriteAttr.ry = params.r;
            return Ext.draw.Draw.ellipsePath(sprite);
        }
        else if (sprite.type == 'ellipse') {
            spriteAttr.rx = params.rx;
            spriteAttr.ry = params.ry;
            return Ext.draw.Draw.ellipsePath(sprite);
        }
        else if (sprite.type == 'rect') {
            spriteAttr.rx = spriteAttr.ry = params.r;
            return Ext.draw.Draw.rectPath(sprite);
        }
        else if (sprite.type == 'path' && spriteAttr.path) {
            return Ext.draw.Draw.pathToAbsolute(spriteAttr.path);
        }
        return false;
    },

    setFill: function (sprite, params) {
        var me = this,
            el = sprite.el.dom,
            fillEl = el.fill,
            newfill = false,
            opacity, gradient, fillUrl, rotation, angle;

        if (!fillEl) {
            // NOT an expando (but it sure looks like one)...
            fillEl = el.fill = me.createNode("fill");
            newfill = true;
        }
        if (Ext.isArray(params.fill)) {
            params.fill = params.fill[0];
        }
        if (params.fill == "none") {
            fillEl.on = false;
        }
        else {
            if (typeof params.opacity == "number") {
                fillEl.opacity = params.opacity;
            }
            if (typeof params["fill-opacity"] == "number") {
                fillEl.opacity = params["fill-opacity"];
            }
            fillEl.on = true;
            if (typeof params.fill == "string") {
                fillUrl = params.fill.match(me.fillUrlRe);
                if (fillUrl) {
                    fillUrl = fillUrl[1];
                    // If the URL matches one of the registered gradients, render that gradient
                    if (fillUrl.charAt(0) == "#") {
                        gradient = me.gradientsColl.getByKey(fillUrl.substring(1));
                    }
                    if (gradient) {
                        // VML angle is offset and inverted from standard, and must be adjusted to match rotation transform
                        rotation = params.rotation;
                        angle = -(gradient.angle + 270 + (rotation ? rotation.degrees : 0)) % 360;
                        // IE will flip the angle at 0 degrees...
                        if (angle === 0) {
                            angle = 180;
                        }
                        fillEl.angle = angle;
                        fillEl.type = "gradient";
                        fillEl.method = "sigma";
                        if (fillEl.colors) {
                            fillEl.colors.value = gradient.colors;
                        } else {
                            fillEl.colors = gradient.colors;
                        }
                    }
                    // Otherwise treat it as an image
                    else {
                        fillEl.src = fillUrl;
                        fillEl.type = "tile";
                    }
                }
                else {
                    fillEl.color = Ext.draw.Color.toHex(params.fill);
                    fillEl.src = "";
                    fillEl.type = "solid";
                }
            }
        }
        if (newfill) {
            el.appendChild(fillEl);
        }
    },

    setStroke: function (sprite, params) {
        var me = this,
            el = sprite.el.dom,
            strokeEl = sprite.strokeEl,
            newStroke = false,
            width, opacity;

        if (!strokeEl) {
            strokeEl = sprite.strokeEl = me.createNode("stroke");
            newStroke = true;
        }
        if (Ext.isArray(params.stroke)) {
            params.stroke = params.stroke[0];
        }
        if (!params.stroke || params.stroke == "none" || params.stroke == 0 || params["stroke-width"] == 0) {
            strokeEl.on = false;
        }
        else {
            strokeEl.on = true;
            if (params.stroke && !params.stroke.match(me.fillUrlRe)) {
                // VML does NOT support a gradient stroke :(
                strokeEl.color = Ext.draw.Color.toHex(params.stroke);
            }
            strokeEl.dashstyle = params["stroke-dasharray"] ? "dash" : "solid";
            strokeEl.joinstyle = params["stroke-linejoin"];
            strokeEl.endcap = params["stroke-linecap"] || "round";
            strokeEl.miterlimit = params["stroke-miterlimit"] || 8;
            width = parseFloat(params["stroke-width"] || 1) * 0.75;
            opacity = params["stroke-opacity"] || 1;
            // VML Does not support stroke widths under 1, so we're going to fiddle with stroke-opacity instead.
            if (Ext.isNumber(width) && width < 1) {
                strokeEl.weight = 1;
                strokeEl.opacity = opacity * width;
            }
            else {
                strokeEl.weight = width;
                strokeEl.opacity = opacity;
            }
        }
        if (newStroke) {
            el.appendChild(strokeEl);
        }
    },

    setClip: function (sprite, params) {
        var me = this,
            el = sprite.el,
            clipEl = sprite.clipEl,
            rect = String(params["clip-rect"]).split(me.separatorRe);
        if (!clipEl) {
            clipEl = sprite.clipEl = me.el.insertFirst(Ext.getDoc().dom.createElement("div"));
            clipEl.addCls(Ext.baseCSSPrefix + 'vml-sprite');
        }
        if (rect.length == 4) {
            rect[2] = +rect[2] + (+rect[0]);
            rect[3] = +rect[3] + (+rect[1]);
            clipEl.setStyle("clip", Ext.String.format("rect({1}px {2}px {3}px {0}px)", rect[0], rect[1], rect[2], rect[3]));
            clipEl.setSize(me.el.width, me.el.height);
        }
        else {
            clipEl.setStyle("clip", "");
        }
    },

    setTextAttributes: function (sprite, params) {
        var me = this,
            vml = sprite.vml,
            textStyle = vml.textpath.style,
            spanCacheStyle = me.span.style,
            zoom = me.zoom,
            round = Math.round,
            fontObj = {
                fontSize: "font-size",
                fontWeight: "font-weight",
                fontStyle: "font-style"
            },
            fontProp,
            paramProp;
        if (sprite.dirtyFont) {
            if (params.font) {
                textStyle.font = spanCacheStyle.font = params.font;
            }
            if (params["font-family"]) {
                textStyle.fontFamily = '"' + params["font-family"].split(",")[0].replace(me.fontFamilyRe, "") + '"';
                spanCacheStyle.fontFamily = params["font-family"];
            }

            for (fontProp in fontObj) {
                paramProp = params[fontObj[fontProp]];
                if (paramProp) {
                    textStyle[fontProp] = spanCacheStyle[fontProp] = paramProp;
                }
            }

            me.setText(sprite, params.text);

            if (vml.textpath.string) {
                me.span.innerHTML = String(vml.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br/>");
            }
            vml.W = me.span.offsetWidth;
            vml.H = me.span.offsetHeight + 2; // TODO handle baseline differences and offset in VML Textpath

            // text-anchor emulation
            if (params["text-anchor"] == "middle") {
                textStyle["v-text-align"] = "center";
            }
            else if (params["text-anchor"] == "end") {
                textStyle["v-text-align"] = "right";
                vml.bbx = -Math.round(vml.W / 2);
            }
            else {
                textStyle["v-text-align"] = "left";
                vml.bbx = Math.round(vml.W / 2);
            }
        }
        vml.X = params.x;
        vml.Y = params.y;
        vml.path.v = Ext.String.format("m{0},{1}l{2},{1}", Math.round(vml.X * zoom), Math.round(vml.Y * zoom), Math.round(vml.X * zoom) + 1);
        // Clear bbox cache
        sprite.bbox.plain = null;
        sprite.bbox.transform = null;
        sprite.dirtyFont = false;
    },

    setText: function (sprite, text) {
        sprite.vml.textpath.string = Ext.htmlDecode(text);
    },

    hide: function () {
        this.el.hide();
    },

    show: function () {
        this.el.show();
    },

    hidePrim: function (sprite) {
        sprite.el.addCls(Ext.baseCSSPrefix + 'hide-visibility');
    },

    showPrim: function (sprite) {
        sprite.el.removeCls(Ext.baseCSSPrefix + 'hide-visibility');
    },

    setSize: function (width, height) {
        var me = this;
        width = width || me.width;
        height = height || me.height;
        me.width = width;
        me.height = height;

        if (me.el) {
            // Size outer div
            if (width != undefined) {
                me.el.setWidth(width);
            }
            if (height != undefined) {
                me.el.setHeight(height);
            }
        }

        me.callParent(arguments);
    },

    /**
     * @private Using the current viewBox property and the surface's width and height, calculate the
     * appropriate viewBoxShift that will be applied as a persistent transform to all sprites.
     */
    applyViewBox: function () {
        var me = this,
            viewBox = me.viewBox,
            width = me.width,
            height = me.height,
            items,
            iLen,
            i;
        
        me.callParent();

        if (viewBox && (width || height)) {
            items = me.items.items;
            iLen = items.length;

            for (i = 0; i < iLen; i++) {
                me.applyTransformations(items[i]);
            }
        }
    },

    onAdd: function (item) {
        this.callParent(arguments);
        if (this.el) {
            this.renderItem(item);
        }
    },

    onRemove: function (sprite) {
        if (sprite.el) {
            sprite.el.remove();
            delete sprite.el;
        }
        this.callParent(arguments);
    },

    render: function (container) {
        var me = this,
            doc = Ext.getDoc().dom,
            el;
        // VML Node factory method (createNode)
        if (!me.createNode) {
            try {
                if (!doc.namespaces.rvml) {
                    doc.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                }
                me.createNode = function (tagName) {
                    return doc.createElement("<rvml:" + tagName + ' class="rvml">');
                };
            } catch (e) {
                me.createNode = function (tagName) {
                    return doc.createElement("<" + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                };
            }
        }

        if (!me.el) {
            el = doc.createElement("div");
            me.el = Ext.get(el);
            me.el.addCls(me.baseVmlCls);

            // Measuring span (offscrren)
            me.span = doc.createElement("span");
            Ext.get(me.span).addCls(me.measureSpanCls);
            el.appendChild(me.span);
            me.el.setSize(me.width || 0, me.height || 0);
            container.appendChild(el);
            me.el.on({
                scope: me,
                mouseup: me.onMouseUp,
                mousedown: me.onMouseDown,
                mouseover: me.onMouseOver,
                mouseout: me.onMouseOut,
                mousemove: me.onMouseMove,
                mouseenter: me.onMouseEnter,
                mouseleave: me.onMouseLeave,
                click: me.onClick,
                dblclick: me.onDblClick
            });
        }
        me.renderAll();
    },

    renderAll: function () {
        this.items.each(this.renderItem, this);
    },

    redraw: function (sprite) {
        sprite.dirty = true;
        this.renderItem(sprite);
    },

    renderItem: function (sprite) {
        // Does the surface element exist?
        if (!this.el) {
            return;
        }

        // Create sprite element if necessary
        if (!sprite.el) {
            this.createSpriteElement(sprite);
        }

        if (sprite.dirty) {
            this.applyAttrs(sprite);
            if (sprite.dirtyTransform) {
                this.applyTransformations(sprite);
            }
        }
    },

    rotationCompensation: function (deg, dx, dy) {
        var matrix = new Ext.draw.Matrix();
        matrix.rotate(-deg, 0.5, 0.5);
        return {
            x: matrix.x(dx, dy),
            y: matrix.y(dx, dy)
        };
    },

    transform: function (sprite, matrixOnly) {
        var me = this,
            bbox = me.getBBox(sprite, true),
            cx = bbox.x + bbox.width * 0.5,
            cy = bbox.y + bbox.height * 0.5,
            matrix = new Ext.draw.Matrix(),
            transforms = sprite.transformations,
            transformsLength = transforms.length,
            i = 0,
            deltaDegrees = 0,
            deltaScaleX = 1,
            deltaScaleY = 1,
            flip = "",
            el = sprite.el,
            dom = el.dom,
            domStyle = dom.style,
            zoom = me.zoom,
            skew = sprite.skew,
            shift = me.viewBoxShift,
            deltaX, deltaY, transform, type, compensate, y, fill, newAngle, zoomScaleX, zoomScaleY, newOrigin, offset;


        for (; i < transformsLength; i++) {
            transform = transforms[i];
            type = transform.type;
            if (type == "translate") {
                matrix.translate(transform.x, transform.y);
            }
            else if (type == "rotate") {
                matrix.rotate(transform.degrees, transform.x, transform.y);
                deltaDegrees += transform.degrees;
            }
            else if (type == "scale") {
                matrix.scale(transform.x, transform.y, transform.centerX, transform.centerY);
                deltaScaleX *= transform.x;
                deltaScaleY *= transform.y;
            }
        }

        sprite.matrix = matrix.clone();

        if (matrixOnly) {
            return;
        }

        if (shift) {
            matrix.prepend(shift.scale, 0, 0, shift.scale, shift.dx * shift.scale, shift.dy * shift.scale);
        }

        // Hide element while we transform
        if (sprite.type != "image" && skew) {
            skew.origin = "0,0";
            // matrix transform via VML skew
            skew.matrix = matrix.toString();
            // skew.offset = '32767,1' OK
            // skew.offset = '32768,1' Crash
            // M$, R U kidding??
            offset = matrix.offset();
            if (offset[0] > 32767) {
                offset[0] = 32767;
            } else if (offset[0] < -32768) {
                offset[0] = -32768;
            }
            if (offset[1] > 32767) {
                offset[1] = 32767;
            } else if (offset[1] < -32768) {
                offset[1] = -32768;
            }
            skew.offset = offset;
        }
        else {
            domStyle.filter = matrix.toFilter();
            domStyle.left = Math.min(
                matrix.x(bbox.x, bbox.y),
                matrix.x(bbox.x + bbox.width, bbox.y),
                matrix.x(bbox.x, bbox.y + bbox.height),
                matrix.x(bbox.x + bbox.width, bbox.y + bbox.height)) + 'px';
            domStyle.top = Math.min(
                matrix.y(bbox.x, bbox.y),
                matrix.y(bbox.x + bbox.width, bbox.y),
                matrix.y(bbox.x, bbox.y + bbox.height),
                matrix.y(bbox.x + bbox.width, bbox.y + bbox.height)) + 'px';
        }
    },

    createItem: function (config) {
        return Ext.create('Ext.draw.Sprite', config);
    },

    getRegion: function () {
        return this.el.getRegion();
    },

    addCls: function (sprite, className) {
        if (sprite && sprite.el) {
            sprite.el.addCls(className);
        }
    },

    removeCls: function (sprite, className) {
        if (sprite && sprite.el) {
            sprite.el.removeCls(className);
        }
    },

    /**
     * Adds a definition to this Surface for a linear gradient. We convert the gradient definition
     * to its corresponding VML attributes and store it for later use by individual sprites.
     * @param {Object} gradient
     */
    addGradient: function (gradient) {
        var gradients = this.gradientsColl || (this.gradientsColl = Ext.create('Ext.util.MixedCollection')),
            colors = [],
            stops = Ext.create('Ext.util.MixedCollection'),
            keys,
            items,
            iLen,
            key,
            item,
            i;

        // Build colors string
        stops.addAll(gradient.stops);
        stops.sortByKey("ASC", function (a, b) {
            a = parseInt(a, 10);
            b = parseInt(b, 10);
            return a > b ? 1 : (a < b ? -1 : 0);
        });

        keys = stops.keys;
        items = stops.items;
        iLen = keys.length;

        for (i = 0; i < iLen; i++) {
            key = keys[i];
            item = items[i];
            colors.push(key + '% ' + item.color);
        }

        gradients.add(gradient.id, {
            colors: colors.join(","),
            angle: gradient.angle
        });
    },

    destroy: function () {
        var me = this;

        me.callParent(arguments);
        if (me.el) {
            me.el.remove();
        }
        delete me.el;
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
 * This layout implements the column arrangement for {@link Ext.form.CheckboxGroup} and {@link Ext.form.RadioGroup}.
 * It groups the component's sub-items into columns based on the component's
 * {@link Ext.form.CheckboxGroup#columns columns} and {@link Ext.form.CheckboxGroup#vertical} config properties.
 */
Ext.define('Ext.layout.container.CheckboxGroup', {
    extend:  Ext.layout.container.Container ,
    alias: ['layout.checkboxgroup'],

    /**
     * @cfg {Boolean} [autoFlex=true]
     * By default,  CheckboxGroup allocates all available space to the configured columns meaning that
     * column are evenly spaced across the container.
     *
     * To have each column only be wide enough to fit the container Checkboxes (or Radios), set `autoFlex` to `false`
     */
    autoFlex: true,

    type: 'checkboxgroup',
    
    createsInnerCt: true,

    childEls: [
        'innerCt'
    ],

    renderTpl: [
        '<table id="{ownerId}-innerCt" class="' + Ext.plainTableCls + '" cellpadding="0"',
            'role="presentation" style="{tableStyle}"><tbody><tr>',
            '<tpl for="columns">',
                '<td class="{parent.colCls}" valign="top" style="{style}">',
                    '{% this.renderColumn(out,parent,xindex-1) %}',
                '</td>',
            '</tpl>',
        '</tr></tbody></table>'
    ],

    lastOwnerItemsGeneration : null,

    beginLayout: function(ownerContext) {
        var me = this,
            columns,
            numCols,
            i, width, cwidth,
            totalFlex = 0, flexedCols = 0,
            autoFlex = me.autoFlex,
            innerCtStyle = me.innerCt.dom.style;

        me.callParent(arguments);

        columns = me.columnNodes;
        ownerContext.innerCtContext = ownerContext.getEl('innerCt', me);

        // The columns config may be an array of widths. Any value < 1 is taken to be a fraction:
        if (!ownerContext.widthModel.shrinkWrap) {
            numCols = columns.length;

            // If columns is an array of numeric widths
            if (me.columnsArray) {

                // first calculate total flex
                for (i = 0; i < numCols; i++) {
                    width = me.owner.columns[i];
                    if (width < 1) {
                        totalFlex += width;
                        flexedCols++;
                    }
                }

                // now apply widths
                for (i = 0; i < numCols; i++) {
                    width = me.owner.columns[i];
                    if (width < 1) {
                        cwidth = ((width / totalFlex) * 100) + '%';
                    } else {
                        cwidth = width + 'px';
                    }
                    columns[i].style.width = cwidth;
                }
            }

            // Otherwise it's the *number* of columns, so distributed the widths evenly
            else {
                for (i = 0; i < numCols; i++) {
                    // autoFlex: true will automatically calculate % widths
                    // autoFlex: false allows the table to decide (shrinkWrap, in effect)
                    // on a per-column basis
                    cwidth = autoFlex
                        ? (1 / numCols * 100) + '%'
                        : '';
                    columns[i].style.width = cwidth;
                    flexedCols++;
                }
            }

            // no flexed cols -- all widths are fixed
            if (!flexedCols) {
                innerCtStyle.tableLayout = 'fixed';
                innerCtStyle.width = '';
            // some flexed cols -- need to fix some
            } else if (flexedCols < numCols) {
                innerCtStyle.tableLayout = 'fixed';
                innerCtStyle.width = '100%';
            // let the table decide
            } else {
                innerCtStyle.tableLayout = 'auto';
                // if autoFlex, fill available space, else compact down
                if (autoFlex) {
                    innerCtStyle.width = '100%';
                } else {
                    innerCtStyle.width = '';
                }
            }

        } else {
            innerCtStyle.tableLayout = 'auto';
            innerCtStyle.width = '';
        }
    },

    cacheElements: function () {
        var me = this;

        // Grab defined childEls
        me.callParent();

        me.rowEl = me.innerCt.down('tr');

        // Grab columns TDs
        me.columnNodes = me.rowEl.dom.childNodes;
    },

    /*
     * Just wait for the child items to all lay themselves out in the width we are configured
     * to make available to them. Then we can measure our height.
     */
    calculate: function(ownerContext) {
        var me = this,
            targetContext, widthShrinkWrap, heightShrinkWrap, shrinkWrap, table, targetPadding;

        // The columnNodes are widthed using their own width attributes, we just need to wait
        // for all children to have arranged themselves in that width, and then collect our height.
        if (!ownerContext.getDomProp('containerChildrenSizeDone')) {
            me.done = false;
        } else {
            targetContext = ownerContext.innerCtContext;
            widthShrinkWrap = ownerContext.widthModel.shrinkWrap;
            heightShrinkWrap = ownerContext.heightModel.shrinkWrap;
            shrinkWrap = heightShrinkWrap || widthShrinkWrap;
            table = targetContext.el.dom;
            targetPadding = shrinkWrap && targetContext.getPaddingInfo();

            if (widthShrinkWrap) {
                ownerContext.setContentWidth(table.offsetWidth + targetPadding.width, true);
            }

            if (heightShrinkWrap) {
                ownerContext.setContentHeight(table.offsetHeight + targetPadding.height, true);
            }
        }
    },

    doRenderColumn: function (out, renderData, columnIndex) {
        // Careful! This method is bolted on to the renderTpl so all we get for context is
        // the renderData! The "this" pointer is the renderTpl instance!

        var me = renderData.$layout,
            owner = me.owner,
            columnCount = renderData.columnCount,
            items = owner.items.items,
            itemCount = items.length,
            item, itemIndex, rowCount, increment, tree;

        // Example:
        //      columnCount = 3
        //      items.length = 10

        if (owner.vertical) {
            //        0   1   2
            //      +---+---+---+
            //    0 | 0 | 4 | 8 |
            //      +---+---+---+
            //    1 | 1 | 5 | 9 |
            //      +---+---+---+
            //    2 | 2 | 6 |   |
            //      +---+---+---+
            //    3 | 3 | 7 |   |
            //      +---+---+---+

            rowCount = Math.ceil(itemCount / columnCount); // = 4
            itemIndex = columnIndex * rowCount;
            itemCount = Math.min(itemCount, itemIndex + rowCount);
            increment = 1;
        } else {
            //        0   1   2
            //      +---+---+---+
            //    0 | 0 | 1 | 2 |
            //      +---+---+---+
            //    1 | 3 | 4 | 5 |
            //      +---+---+---+
            //    2 | 6 | 7 | 8 |
            //      +---+---+---+
            //    3 | 9 |   |   |
            //      +---+---+---+

            itemIndex = columnIndex;
            increment = columnCount;
        }

        for ( ; itemIndex < itemCount; itemIndex += increment) {
            item = items[itemIndex];
            me.configureItem(item);
            tree = item.getRenderTree();
            Ext.DomHelper.generateMarkup(tree, out);
        }
    },

    /**
     * Returns the number of columns in the checkbox group.
     * @private
     */
    getColumnCount: function() {
        var me = this,
            owner = me.owner,
            ownerColumns = owner.columns;

        // Our columns config is an array of numeric widths.
        // Calculate our total width
        if (me.columnsArray) {
            return ownerColumns.length;
        }

        if (Ext.isNumber(ownerColumns)) {
            return ownerColumns;
        }
        return owner.items.length;
    },

    getItemSizePolicy: function (item) {
        return this.autoSizePolicy;
    },

    getRenderData: function () {
        var me = this,
            data = me.callParent(),
            owner = me.owner,
            i, columns = me.getColumnCount(),
            width, column, cwidth,
            autoFlex = me.autoFlex,
            totalFlex = 0, flexedCols = 0;

        // calculate total flex
        if (me.columnsArray) {
            for (i=0; i < columns; i++) {
                width = me.owner.columns[i];
                if (width < 1) {
                    totalFlex += width;
                    flexedCols++;
                }
            }
        }

        data.colCls = owner.groupCls;
        data.columnCount = columns;

        data.columns = [];
        for (i = 0; i < columns; i++) {
            column = (data.columns[i] = {});

            if (me.columnsArray) {
                width = me.owner.columns[i];
                if (width < 1) {
                    cwidth = ((width / totalFlex) * 100) + '%';
                } else {
                    cwidth = width + 'px';
                }
                column.style = 'width:' + cwidth;
            } else {
                column.style = 'width:' + (1 / columns * 100) + '%';
                flexedCols++;
            }
        }

        // If the columns config was an array of column widths, allow table to auto width
        data.tableStyle =
            !flexedCols ? 'table-layout:fixed;' :
            (flexedCols < columns) ? 'table-layout:fixed;width:100%' :
            (autoFlex) ? 'table-layout:auto;width:100%' : 'table-layout:auto;';

        return data;
    },

    initLayout: function () {
        var me = this,
            owner = me.owner;

        me.columnsArray = Ext.isArray(owner.columns);
        me.autoColumns = !owner.columns || owner.columns === 'auto';
        me.vertical = owner.vertical;

        me.callParent();
    },

    // Always valid. beginLayout ensures the encapsulating elements of all children are in the correct place
    isValidParent: function() {
        return true;
    },

    setupRenderTpl: function (renderTpl) {
        this.callParent(arguments);

        renderTpl.renderColumn = this.doRenderColumn;
    },

    renderChildren: function () {
        var me = this,
            generation = me.owner.items.generation;

        if (me.lastOwnerItemsGeneration !== generation) {
            me.lastOwnerItemsGeneration = generation;
            me.renderItems(me.getLayoutItems());
        }
    },

    /**
     * Iterates over all passed items, ensuring they are rendered.  If the items are already rendered,
     * also determines if the items are in the proper place in the dom.
     * @protected
     */
    renderItems : function(items) {
        var me = this,
            itemCount = items.length,
            i,
            item,
            rowCount,
            columnCount,
            rowIndex,
            columnIndex;

        if (itemCount) {
            Ext.suspendLayouts();

            if (me.autoColumns) {
                me.addMissingColumns(itemCount);
            }

            columnCount = me.columnNodes.length;
            rowCount = Math.ceil(itemCount / columnCount);

            for (i = 0; i < itemCount; i++) {
                item = items[i];
                rowIndex = me.getRenderRowIndex(i, rowCount, columnCount);
                columnIndex = me.getRenderColumnIndex(i, rowCount, columnCount);

                if (!item.rendered) {
                    me.renderItem(item, rowIndex, columnIndex);
                } else if (!me.isItemAtPosition(item, rowIndex, columnIndex)) {
                    me.moveItem(item, rowIndex, columnIndex);
                }
            }

            if (me.autoColumns) {
                me.removeExceedingColumns(itemCount);
            }

            Ext.resumeLayouts(true);
        }
    },

    isItemAtPosition : function(item, rowIndex, columnIndex) {
        return item.el.dom === this.getNodeAt(rowIndex, columnIndex);
    },

    getRenderColumnIndex : function(itemIndex, rowCount, columnCount) {
        if (this.vertical) {
            return Math.floor(itemIndex / rowCount);
        } else {
            return itemIndex % columnCount;
        }
    },

    getRenderRowIndex : function(itemIndex, rowCount, columnCount) {
        var me = this;
        if (me.vertical) {
            return itemIndex % rowCount;
        } else {
            return Math.floor(itemIndex / columnCount);
        }
    },

    getNodeAt : function(rowIndex, columnIndex) {
        return this.columnNodes[columnIndex].childNodes[rowIndex];
    },

    addMissingColumns : function(itemsCount) {
        var me = this,
            existingColumnsCount = me.columnNodes.length,
            missingColumnsCount,
            row,
            cls,
            i;
        if (existingColumnsCount < itemsCount) {
            missingColumnsCount = itemsCount - existingColumnsCount;
            row = me.rowEl;
            cls = me.owner.groupCls;
            for (i = 0; i < missingColumnsCount; i++) {
                row.createChild({
                    cls: cls,
                    tag: 'td',
                    vAlign: 'top'
                });
            }
        }
    },

    removeExceedingColumns : function(itemsCount) {
        var me = this,
            existingColumnsCount = me.columnNodes.length,
            exceedingColumnsCount,
            row,
            i;
        if (existingColumnsCount > itemsCount) {
            exceedingColumnsCount = existingColumnsCount - itemsCount;
            row = me.rowEl;
            for (i = 0; i < exceedingColumnsCount; i++) {
                row.last().remove();
            }
        }
    },

    /**
     * Renders the given Component into the specified row and column
     * @param {Ext.Component} item The Component to render
     * @param {number} rowIndex row index
     * @param {number} columnIndex column index
     * @private
     */
    renderItem : function(item, rowIndex, columnIndex) {
        var me = this;

        me.configureItem(item);
        item.render(Ext.get(me.columnNodes[columnIndex]), rowIndex);
        me.afterRenderItem(item);
    },

    /**
     * Moves the given already rendered Component to the specified row and column
     * @param {Ext.Component} item The Component to move
     * @param {number} rowIndex row index
     * @param {number} columnIndex column index
     * @private
     */
    moveItem : function(item, rowIndex, columnIndex) {
        var me = this,
            column = me.columnNodes[columnIndex],
            targetNode = column.childNodes[rowIndex];
        column.insertBefore(item.el.dom, targetNode || null);
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
 * This is a layout that inherits the anchoring of {@link Ext.layout.container.Anchor} and adds the
 * ability for x/y positioning using the standard x and y component config options.
 *
 * This class is intended to be extended or created via the {@link Ext.container.Container#layout layout}
 * configuration property.  See {@link Ext.container.Container#layout} for additional details.
 *
 *     @example
 *     Ext.create('Ext.form.Panel', {
 *         title: 'Absolute Layout',
 *         width: 300,
 *         height: 275,
 *         layout: {
 *             type: 'absolute'
 *             // layout-specific configs go here
 *             //itemCls: 'x-abs-layout-item',
 *         },
 *         url:'save-form.php',
 *         defaultType: 'textfield',
 *         items: [{
 *             x: 10,
 *             y: 10,
 *             xtype:'label',
 *             text: 'Send To:'
 *         },{
 *             x: 80,
 *             y: 10,
 *             name: 'to',
 *             anchor:'90%'  // anchor width by percentage
 *         },{
 *             x: 10,
 *             y: 40,
 *             xtype:'label',
 *             text: 'Subject:'
 *         },{
 *             x: 80,
 *             y: 40,
 *             name: 'subject',
 *             anchor: '90%'  // anchor width by percentage
 *         },{
 *             x:0,
 *             y: 80,
 *             xtype: 'textareafield',
 *             name: 'msg',
 *             anchor: '100% 100%'  // anchor width and height
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 */
Ext.define('Ext.layout.container.Absolute', {

    /* Begin Definitions */

    alias: 'layout.absolute',
    extend:  Ext.layout.container.Anchor ,
    alternateClassName: 'Ext.layout.AbsoluteLayout',

    /* End Definitions */

    targetCls: Ext.baseCSSPrefix + 'abs-layout-ct',
    itemCls: Ext.baseCSSPrefix + 'abs-layout-item',

    /**
     * @cfg {Boolean} ignoreOnContentChange
     * True indicates that changes to one item in this layout do not effect the layout in
     * general. This may need to be set to false if {@link Ext.Component#autoScroll}
     * is enabled for the container.
     */
    ignoreOnContentChange: true,

    type: 'absolute',

    // private
    adjustWidthAnchor: function(value, childContext) {
        var padding = this.targetPadding,
            x = childContext.getStyle('left');

        return value - x + padding.left;
    },

    // private
    adjustHeightAnchor: function(value, childContext) {
        var padding = this.targetPadding,
            y = childContext.getStyle('top');

        return value - y + padding.top;
    },

    isItemLayoutRoot: function (item) {
        return this.ignoreOnContentChange || this.callParent(arguments);
    },

    isItemShrinkWrap: function (item) {
        return true;
    },

    beginLayout: function (ownerContext) {
        var me = this,
            target = me.getTarget();

        me.callParent(arguments);

        // Do not set position: relative; when the absolute layout target is the body
        if (target.dom !== document.body) {
            target.position();
        }

        me.targetPadding = ownerContext.targetContext.getPaddingInfo();
    },

    isItemBoxParent: function (itemContext) {
        return true;
    },

    onContentChange: function () {
        if (this.ignoreOnContentChange) {
            return false;
        }
        return this.callParent(arguments);
    },

    calculateContentSize: function (ownerContext, dimensions) {
        var me = this,
            containerDimensions = (dimensions || 0) |
                   ((ownerContext.widthModel.shrinkWrap ? 1 : 0) |
                    (ownerContext.heightModel.shrinkWrap ? 2 : 0)),
            calcWidth = (containerDimensions & 1) || undefined,
            calcHeight = (containerDimensions & 2) || undefined,
            childItems = ownerContext.childItems,
            length = childItems.length,
            contentHeight = 0,
            contentWidth = 0,
            needed = 0,
            props = ownerContext.props,
            targetPadding, child, childContext, height, i, margins, width;

        if (calcWidth) {
            if (isNaN(props.contentWidth)) {
                ++needed;
            } else {
                calcWidth = undefined;
            }
        }
        if (calcHeight) {
            if (isNaN(props.contentHeight)) {
                ++needed;
            } else {
                calcHeight = undefined;
            }
        }

        if (needed) {
            for (i = 0; i < length; ++i) {
                childContext = childItems[i];
                child = childContext.target;
                height = calcHeight && childContext.getProp('height');
                width = calcWidth && childContext.getProp('width');
                margins = childContext.getMarginInfo();

                height += margins.bottom;
                width  += margins.right;

                contentHeight = Math.max(contentHeight, (child.y || 0) + height);
                contentWidth = Math.max(contentWidth, (child.x || 0) + width);

                if (isNaN(contentHeight) && isNaN(contentWidth)) {
                    me.done = false;
                    return;
                }
            }

            if (calcWidth || calcHeight) {
                targetPadding = ownerContext.targetContext.getPaddingInfo();
            }
            if (calcWidth && !ownerContext.setContentWidth(contentWidth + targetPadding.width)) {
                me.done = false;
            }
            if (calcHeight && !ownerContext.setContentHeight(contentHeight + targetPadding.height)) {
                me.done = false;
            }

            /* add a '/' to turn on this log ('//* enables, '/*' disables)
            if (me.done) {
                var el = ownerContext.targetContext.el.dom;
                Ext.log(this.owner.id, '.contentSize: ', contentWidth, 'x', contentHeight,
                    ' => scrollSize: ', el.scrollWidth, 'x', el.scrollHeight);
            }/**/
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
 * This is a layout that manages multiple Panels in an expandable accordion style such that by default only
 * one Panel can be expanded at any given time (set {@link #multi} config to have more open). Each Panel has
 * built-in support for expanding and collapsing.
 *
 * Note: Only Ext Panels and all subclasses of Ext.panel.Panel may be used in an accordion layout Container.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         title: 'Accordion Layout',
 *         width: 300,
 *         height: 300,
 *         defaults: {
 *             // applied to each contained panel
 *             bodyStyle: 'padding:15px'
 *         },
 *         layout: {
 *             // layout-specific configs go here
 *             type: 'accordion',
 *             titleCollapse: false,
 *             animate: true,
 *             activeOnTop: true
 *         },
 *         items: [{
 *             title: 'Panel 1',
 *             html: 'Panel content!'
 *         },{
 *             title: 'Panel 2',
 *             html: 'Panel content!'
 *         },{
 *             title: 'Panel 3',
 *             html: 'Panel content!'
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 */
Ext.define('Ext.layout.container.Accordion', {
    extend:  Ext.layout.container.VBox ,
    alias: ['layout.accordion'],
    alternateClassName: 'Ext.layout.AccordionLayout',

    targetCls: Ext.baseCSSPrefix + 'accordion-layout-ct',
    itemCls: [Ext.baseCSSPrefix + 'box-item', Ext.baseCSSPrefix + 'accordion-item'],

    align: 'stretch',

    /**
     * @cfg {Boolean} fill
     * True to adjust the active item's height to fill the available space in the container, false to use the
     * item's current height, or auto height if not explicitly set.
     */
    fill : true,

    /**
     * @cfg {Boolean} autoWidth
     * Child Panels have their width actively managed to fit within the accordion's width.
     * @removed This config is ignored in ExtJS 4
     */

    /**
     * @cfg {Boolean} titleCollapse
     * True to allow expand/collapse of each contained panel by clicking anywhere on the title bar, false to allow
     * expand/collapse only when the toggle tool button is clicked.  When set to false,
     * {@link #hideCollapseTool} should be false also. An explicit {@link Ext.panel.Panel#titleCollapse} declared
     * on the panel will override this setting.
     */
    titleCollapse : true,

    /**
     * @cfg {Boolean} hideCollapseTool
     * True to hide the contained Panels' collapse/expand toggle buttons, false to display them.
     * When set to true, {@link #titleCollapse} is automatically set to true.
     */
    hideCollapseTool : false,

    /**
     * @cfg {Boolean} collapseFirst
     * True to make sure the collapse/expand toggle button always renders first (to the left of) any other tools
     * in the contained Panels' title bars, false to render it last. By default, this will use the 
     * {@link Ext.panel.Panel#collapseFirst} setting on the panel. If the config option is specified on the layout,
     * it will override the panel value.
     */
    collapseFirst : undefined,

    /**
     * @cfg {Boolean} animate
     * True to slide the contained panels open and closed during expand/collapse using animation, false to open and
     * close directly with no animation. Note: The layout performs animated collapsing
     * and expanding, *not* the child Panels.
     */
    animate : true,
    /**
     * @cfg {Boolean} activeOnTop
     * Only valid when {@link #multi} is `false` and {@link #animate} is `false`.
     *
     * True to swap the position of each panel as it is expanded so that it becomes the first item in the container,
     * false to keep the panels in the rendered order.
     */
    activeOnTop : false,
    /**
     * @cfg {Boolean} multi
     * Set to true to enable multiple accordion items to be open at once.
     */
    multi: false,
    
    defaultAnimatePolicy: {
        y: true,
        height: true
    },

    constructor: function() {
        var me = this;

        me.callParent(arguments);

        if (!me.multi && me.animate) {
            me.animatePolicy = Ext.apply({}, me.defaultAnimatePolicy);
        } else {
            me.animatePolicy = null;
        }
    },

    beforeRenderItems: function (items) {
        var me = this,
            ln = items.length,
            i = 0,
            owner = me.owner,
            collapseFirst = me.collapseFirst,
            hasCollapseFirst = Ext.isDefined(collapseFirst),
            expandedItem = me.getExpanded(true)[0],
            multi = me.multi,
            comp;

        for (; i < ln; i++) {
            comp = items[i];
            if (!comp.rendered) {
                // Set up initial properties for Panels in an accordion.
                if (!multi || comp.collapsible !== false) {
                    comp.collapsible = true;
                }
                
                if (comp.collapsible) {
                    if (hasCollapseFirst) {
                        comp.collapseFirst = collapseFirst;
                    }
                    if (me.hideCollapseTool) {
                        comp.hideCollapseTool = me.hideCollapseTool;
                        comp.titleCollapse = true;
                    } else if (me.titleCollapse && comp.titleCollapse === undefined) {
                        // Only force titleCollapse if we don't explicitly
                        // set one on the child panel
                        comp.titleCollapse = me.titleCollapse;
                    }
                }
                
                delete comp.hideHeader;
                delete comp.width;
                comp.title = comp.title || '&#160;';
                comp.addBodyCls(Ext.baseCSSPrefix + 'accordion-body');

                // If only one child Panel is allowed to be expanded
                // then collapse all except the first one found with collapsed:false
                // If we have hasExpanded set, we've already done this
                if (!multi) {
                    if (expandedItem) {
                        comp.collapsed = expandedItem !== comp;
                    } else if (comp.hasOwnProperty('collapsed') && comp.collapsed === false) {
                        expandedItem = comp;
                    } else {
                        comp.collapsed = true;
                    }

                    // If only one child Panel may be expanded, then intercept expand/show requests.
                    owner.mon(comp, {
                        show: me.onComponentShow,
                        beforeexpand: me.onComponentExpand,
                        beforecollapse: me.onComponentCollapse,
                        scope: me
                    });
                }
                // Need to still check this outside multi because we don't want
                // a single item to be able to collapse
                owner.mon(comp, 'beforecollapse', me.onComponentCollapse, me);
                comp.headerOverCls = Ext.baseCSSPrefix + 'accordion-hd-over';
            }
        }

        // If no collapsed:false Panels found, make the first one expanded.
        if (!multi) {
            if (!expandedItem) {
                if (ln) {
                    items[0].collapsed = false;
                }
            } else if (me.activeOnTop) {
                expandedItem.collapsed = false;
                me.configureItem(expandedItem);
                if (owner.items.indexOf(expandedItem) > 0) {
                    owner.insert(0, expandedItem);
                }
            }
        }
    },

    getItemsRenderTree: function(items) {
        this.beforeRenderItems(items);
        return this.callParent(arguments);
    },

    renderItems : function(items, target) {
        this.beforeRenderItems(items);

        this.callParent(arguments);
    },

    configureItem: function(item) {
        this.callParent(arguments);

        // We handle animations for the expand/collapse of items.
        // Items do not have individual borders
        item.animCollapse = item.border = false;

        // If filling available space, all Panels flex.
        if (this.fill) {
            item.flex = 1;
        }
    },

    beginLayout: function (ownerContext) {
        this.callParent(arguments);
        this.updatePanelClasses(ownerContext);
    },

    updatePanelClasses: function(ownerContext) {
        var children = ownerContext.visibleItems,
            ln = children.length,
            siblingCollapsed = true,
            i, child, header;

        for (i = 0; i < ln; i++) {
            child = children[i];
            header = child.header;
            header.addCls(Ext.baseCSSPrefix + 'accordion-hd');

            if (siblingCollapsed) {
                header.removeCls(Ext.baseCSSPrefix + 'accordion-hd-sibling-expanded');
            } else {
                header.addCls(Ext.baseCSSPrefix + 'accordion-hd-sibling-expanded');
            }

            if (i + 1 == ln && child.collapsed) {
                header.addCls(Ext.baseCSSPrefix + 'accordion-hd-last-collapsed');
            } else {
                header.removeCls(Ext.baseCSSPrefix + 'accordion-hd-last-collapsed');
            }

            siblingCollapsed = child.collapsed;
        }
    },

    // When a Component expands, adjust the heights of the other Components to be just enough to accommodate
    // their headers.
    // The expanded Component receives the only flex value, and so gets all remaining space.
    onComponentExpand: function(toExpand) {
        var me = this,
            owner = me.owner,
            multi = me.multi,
            animate = me.animate,
            moveToTop = !multi && !me.animate && me.activeOnTop,
            expanded,
            expandedCount, i,
            previousValue;

        if (!me.processing) {
            me.processing = true;
            previousValue = owner.deferLayouts;
            owner.deferLayouts = true;
            expanded = multi ? [] : me.getExpanded();
            expandedCount = expanded.length;
            
            // Collapse all other expanded child items (Won't loop if multi is true)
            for (i = 0; i < expandedCount; i++) {
                expanded[i].collapse();
            }
            
            if (moveToTop) {
                // Prevent extra layout when moving the item
                Ext.suspendLayouts();
                owner.insert(0, toExpand);
                Ext.resumeLayouts();
            }
            
            owner.deferLayouts = previousValue;
            me.processing = false;
        }
    },

    onComponentCollapse: function(comp) {
        var me = this,
            owner = me.owner,
            toExpand,
            expanded,
            previousValue;

        if (me.owner.items.getCount() === 1) {
            // do not allow collapse if there is only one item
            return false;
        }

        if (!me.processing) {
            me.processing = true;
            previousValue = owner.deferLayouts;
            owner.deferLayouts = true;
            toExpand = comp.next() || comp.prev();

            // If we are allowing multi, and the "toCollapse" component is NOT the only expanded Component,
            // then ask the box layout to collapse it to its header.
            if (me.multi) {
                expanded = me.getExpanded();

                // If the collapsing Panel is the only expanded one, expand the following Component.
                // All this is handling fill: true, so there must be at least one expanded,
                if (expanded.length === 1) {
                    toExpand.expand();
                }

            } else if (toExpand) {
                toExpand.expand();
            }
            owner.deferLayouts = previousValue;
            me.processing = false;
        }
    },

    onComponentShow: function(comp) {
        // Showing a Component means that you want to see it, so expand it.
        this.onComponentExpand(comp);
    },
    
    getExpanded: function(explicitCheck){
        var items = this.owner.items.items,
            len = items.length,
            i = 0,
            out = [],
            add,
            item;
            
        for (; i < len; ++i) {
            item = items[i];
            if (explicitCheck) {
                add = item.hasOwnProperty('collapsed') && item.collapsed === false;
            } else {
                add = !item.collapsed;
            }
            if (add) {
                out.push(item);
            }
        }
        return out;
            
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
 * This is the layout style of choice for creating structural layouts in a multi-column format where the width of each
 * column can be specified as a percentage or fixed width, but the height is allowed to vary based on the content. This
 * class is intended to be extended or created via the layout:'column' {@link Ext.container.Container#layout} config,
 * and should generally not need to be created directly via the new keyword.
 *
 * ColumnLayout does not have any direct config options (other than inherited ones), but it does support a specific
 * config property of `columnWidth` that can be included in the config of any panel added to it. The layout will use
 * the columnWidth (if present) or width of each panel during layout to determine how to size each panel. If width or
 * columnWidth is not specified for a given panel, its width will default to the panel's width (or auto).
 *
 * The width property is always evaluated as pixels, and must be a number greater than or equal to 1. The columnWidth
 * property is always evaluated as a percentage, and must be a decimal value greater than 0 and less than 1 (e.g., .25).
 *
 * The basic rules for specifying column widths are pretty simple. The logic makes two passes through the set of
 * contained panels. During the first layout pass, all panels that either have a fixed width or none specified (auto)
 * are skipped, but their widths are subtracted from the overall container width.
 *
 * During the second pass, all panels with columnWidths are assigned pixel widths in proportion to their percentages
 * based on the total **remaining** container width. In other words, percentage width panels are designed to fill
 * the space left over by all the fixed-width and/or auto-width panels. Because of this, while you can specify any
 * number of columns with different percentages, the columnWidths must always add up to 1 (or 100%) when added
 * together, otherwise your layout may not render as expected.
 *
 *     @example
 *     // All columns are percentages -- they must add up to 1
 *     Ext.create('Ext.panel.Panel', {
 *         title: 'Column Layout - Percentage Only',
 *         width: 350,
 *         height: 250,
 *         layout:'column',
 *         items: [{
 *             title: 'Column 1',
 *             columnWidth: 0.25
 *         },{
 *             title: 'Column 2',
 *             columnWidth: 0.55
 *         },{
 *             title: 'Column 3',
 *             columnWidth: 0.20
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 *
 *     // Mix of width and columnWidth -- all columnWidth values must add up
 *     // to 1. The first column will take up exactly 120px, and the last two
 *     // columns will fill the remaining container width.
 *
 *     Ext.create('Ext.Panel', {
 *         title: 'Column Layout - Mixed',
 *         width: 350,
 *         height: 250,
 *         layout:'column',
 *         items: [{
 *             title: 'Column 1',
 *             width: 120
 *         },{
 *             title: 'Column 2',
 *             columnWidth: 0.7
 *         },{
 *             title: 'Column 3',
 *             columnWidth: 0.3
 *         }],
 *         renderTo: Ext.getBody()
 *     });
 */
Ext.define('Ext.layout.container.Column', {

    extend:  Ext.layout.container.Auto ,
    alias: ['layout.column'],
    alternateClassName: 'Ext.layout.ColumnLayout',

    type: 'column',

    itemCls: Ext.baseCSSPrefix + 'column',

    targetCls: Ext.baseCSSPrefix + 'column-layout-ct',

    // Columns with a columnWidth have their width managed.
    columnWidthSizePolicy: {
        readsWidth: 0,
        readsHeight: 1,
        setsWidth: 1,
        setsHeight: 0
    },
    
    createsInnerCt: true,

    manageOverflow: true,
    
    isItemShrinkWrap: function(ownerContext){
        return true;
    },

    getItemSizePolicy: function (item, ownerSizeModel) {
        if (item.columnWidth) {
            if (!ownerSizeModel) {
                ownerSizeModel = this.owner.getSizeModel();
            }

            if (!ownerSizeModel.width.shrinkWrap) {
                return this.columnWidthSizePolicy;
            }
        }
        return this.autoSizePolicy;
    },

    calculateItems: function (ownerContext, containerSize) {
        var me = this,
            targetContext = ownerContext.targetContext,
            items = ownerContext.childItems,
            len = items.length,
            contentWidth = 0,
            gotWidth = containerSize.gotWidth,
            blocked, availableWidth, i, itemContext, itemMarginWidth, itemWidth;

        // No parallel measurement, cannot lay out boxes.
        if (gotWidth === false) { //\\ TODO: Deal with target padding width
            // TODO: only block if we have items with columnWidth
            targetContext.domBlock(me, 'width');
            blocked = true;
        } else if (gotWidth) {
            availableWidth = containerSize.width;
        } else {
            // gotWidth is undefined, which means we must be width shrink wrap.
            // cannot calculate columnWidths if we're shrink wrapping.
            return true;
        }

        // we need the widths of the columns we don't manage to proceed so we block on them
        // if they are not ready...
        for (i = 0; i < len; ++i) {
            itemContext = items[i];

            // this is needed below for non-calculated columns, but is also needed in the
            // next loop for calculated columns... this way we only call getMarginInfo in
            // this loop and use the marginInfo property in the next...
            itemMarginWidth = itemContext.getMarginInfo().width;

            if (!itemContext.widthModel.calculated) {
                itemWidth = itemContext.getProp('width');
                if (typeof itemWidth != 'number') {
                    itemContext.block(me, 'width');
                    blocked = true;
                }

                contentWidth += itemWidth + itemMarginWidth;
            }
        }

        if (!blocked) {
            availableWidth = (availableWidth < contentWidth) ? 0 : availableWidth - contentWidth;

            for (i = 0; i < len; ++i) {
                itemContext = items[i];
                if (itemContext.widthModel.calculated) {
                    itemMarginWidth = itemContext.marginInfo.width; // always set by above loop
                    itemWidth = itemContext.target.columnWidth;
                    itemWidth = Math.floor(itemWidth * availableWidth) - itemMarginWidth;
                    itemWidth = itemContext.setWidth(itemWidth); // constrains to min/maxWidth
                    contentWidth += itemWidth + itemMarginWidth;
                }
            }

            ownerContext.setContentWidth(contentWidth + ownerContext.paddingContext.getPaddingInfo().width);
        }

        // we registered all the values that block this calculation, so abort now if blocked...
        return !blocked;
    },

    setCtSizeIfNeeded: function(ownerContext, containerSize) {
        var me = this,
            padding = ownerContext.paddingContext.getPaddingInfo();

        me.callParent(arguments);

        // IE6/7/quirks lose right padding when using the shrink wrap template, so
        // reduce the size of the outerCt by the amount of right padding.
        if ((Ext.isIEQuirks || Ext.isIE7m) && me.isShrinkWrapTpl && padding.right) {
            ownerContext.outerCtContext.setProp('width',
                containerSize.width + padding.left);
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
 * This is a layout that will render form Fields, one under the other all stretched to the Container width.
 *
 *     @example
 *     Ext.create('Ext.Panel', {
 *         width: 500,
 *         height: 300,
 *         title: "FormLayout Panel",
 *         layout: 'form',
 *         renderTo: Ext.getBody(),
 *         bodyPadding: 5,
 *         defaultType: 'textfield',
 *         items: [{
 *            fieldLabel: 'First Name',
 *             name: 'first',
 *             allowBlank:false
 *         },{
 *             fieldLabel: 'Last Name',
 *             name: 'last'
 *         },{
 *             fieldLabel: 'Company',
 *             name: 'company'
 *         }, {
 *             fieldLabel: 'Email',
 *             name: 'email',
 *             vtype:'email'
 *         }, {
 *             fieldLabel: 'DOB',
 *             name: 'dob',
 *             xtype: 'datefield'
 *         }, {
 *             fieldLabel: 'Age',
 *             name: 'age',
 *             xtype: 'numberfield',
 *             minValue: 0,
 *             maxValue: 100
 *         }, {
 *             xtype: 'timefield',
 *             fieldLabel: 'Time',
 *             name: 'time',
 *             minValue: '8:00am',
 *             maxValue: '6:00pm'
 *         }]
 *     });
 *
 * Note that any configured {@link Ext.Component#padding padding} will be ignored on items within a Form layout.
 */
Ext.define('Ext.layout.container.Form', {

    /* Begin Definitions */

    alias: 'layout.form',
    extend:  Ext.layout.container.Container ,
    alternateClassName: 'Ext.layout.FormLayout',

    /* End Definitions */
   
    tableCls: Ext.baseCSSPrefix + 'form-layout-table',

    type: 'form',
    
    createsInnerCt: true,

    manageOverflow: true,

    // Begin with no previous adjustments
    lastOverflowAdjust: {
        width: 0,
        height: 0
    },

    childEls: ['formTable'],
    
    padRow: '<tr><td class="' + Ext.baseCSSPrefix + 'form-item-pad" colspan="3"></td></tr>',

    renderTpl: [
        '<table id="{ownerId}-formTable" class="{tableCls}" style="width:100%" cellpadding="0">',
            '{%this.renderBody(out,values)%}',
        '</table>',
        '{%this.renderPadder(out,values)%}'
    ],

    getRenderData: function(){
        var data = this.callParent();
        data.tableCls = this.tableCls;
        return data;    
    },

    calculate : function (ownerContext) {
        var me = this,
            containerSize = me.getContainerSize(ownerContext, true),
            tableWidth,
            childItems,
            i = 0, length,
            shrinkwrapHeight = ownerContext.sizeModel.height.shrinkWrap;

        if (shrinkwrapHeight) {
            if (ownerContext.hasDomProp('containerChildrenSizeDone')) {
                ownerContext.setProp('contentHeight', me.formTable.dom.offsetHeight + ownerContext.targetContext.getPaddingInfo().height);
            } else {
                me.done = false;
            }
        }

        // Once we have been widthed, we can impose that width (in a non-dirty setting) upon all children at once
        if (containerSize.gotWidth) {
            tableWidth = me.formTable.dom.offsetWidth;
            childItems = ownerContext.childItems;

            for (length = childItems.length; i < length; ++i) {
                childItems[i].setWidth(tableWidth, false);
            }
        } else {
            me.done = false;
        }
    },

    getRenderTarget: function() {
        return this.formTable;
    },

    getRenderTree: function() {
        var me = this,
            result = me.callParent(arguments),
            i, len;

        for (i = 0, len = result.length; i < len; i++) {
            result[i] = me.transformItemRenderTree(result[i]);
        }
        return result;
    },

    transformItemRenderTree: function(item) {

        if (item.tag && item.tag == 'table') {
            item.tag = 'tbody';
            delete item.cellspacing;
            delete item.cellpadding;

            // IE6 doesn't separate cells nicely to provide input field
            // vertical separation. It also does not support transparent borders
            // which is how the extra 1px is added to the 2px each side cell spacing.
            // So it needs a 5px high pad row.
            if (Ext.isIE6) {
                item.cn = this.padRow;
            }

            return item;
        }

        return {
            tag: 'tbody',
            cn: {
                tag: 'tr',
                cn: {
                    tag: 'td',
                    colspan: 3,
                    style: 'width:100%',
                    cn: item
                }
            }
        };

    },

    isValidParent: function(item, target, position) {
        return true;
    },

    isItemShrinkWrap: function(item) {
        return ((item.shrinkWrap === true) ? 3 : item.shrinkWrap||0) & 2;
    },

    getItemSizePolicy: function(item) {
        return {
            setsWidth: 1,
            setsHeight: 0
        };
    },


// All of the below methods are old methods moved here from Container layout
// TODO: remove these methods once Form layout extends Auto layout

    beginLayoutCycle: function (ownerContext, firstCycle) {
        var padEl = this.overflowPadderEl;

        if (padEl) {
            padEl.setStyle('display', 'none');
        }

        // Begin with the scrollbar adjustment that we used last time - this is more likely to be correct
        // than beginning with no adjustment at all
        if (!ownerContext.state.overflowAdjust) {
            ownerContext.state.overflowAdjust = this.lastOverflowAdjust;
        }
    },

    /**
     * Handles overflow processing for a container. This should be called once the layout
     * has determined contentWidth/Height. In addition to the ownerContext passed to the
     * {@link #calculate} method, this method also needs the containerSize (the object
     * returned by {@link #getContainerSize}).
     * 
     * @param {Ext.layout.ContextItem} ownerContext
     * @param {Object} containerSize
     * @param {Number} dimensions A bit mask for the overflow managed dimensions. The 0-bit
     * is for `width` and the 1-bit is for `height`. In other words, a value of 1 would be
     * only `width`, 2 would be only `height` and 3 would be both.
     */
    calculateOverflow: function (ownerContext, containerSize, dimensions) {
        var me = this,
            targetContext = ownerContext.targetContext,
            manageOverflow = me.manageOverflow,
            state = ownerContext.state,
            overflowAdjust = state.overflowAdjust,
            padWidth, padHeight, padElContext, padding, scrollRangeFlags,
            scrollbarSize, contentW, contentH, ownerW, ownerH, scrollbars,
            xauto, yauto;

        if (manageOverflow && !state.secondPass && !me.reserveScrollbar) {
            // Determine the dimensions that have overflow:auto applied. If these come by
            // way of component config, this does not require a DOM read:
            xauto = (me.getOverflowXStyle(ownerContext) === 'auto');
            yauto = (me.getOverflowYStyle(ownerContext) === 'auto');

            // If the container layout is not using width, we don't need to adjust for the
            // vscroll (likewise for height). Perhaps we don't even need to run the layout
            // again if the adjustments won't have any effect on the result!
            if (!containerSize.gotWidth) {
                xauto = false;
            }
            if (!containerSize.gotHeight) {
                yauto = false;
            }

            if (xauto || yauto) {
                scrollbarSize = Ext.getScrollbarSize();

                // as a container we calculate contentWidth/Height, so we don't want
                // to use getProp and make it look like we are triggered by them...
                contentW = ownerContext.peek('contentWidth');
                contentH = ownerContext.peek('contentHeight');
                // The content size includes the target element's padding.  Since
                // the containerSize excludes the target element's padding, we  need
                // to subtract this padding from the content size before checking
                // to see if scrollbars are needed.
                padding = targetContext.getPaddingInfo();
                contentW -= padding.width;
                contentH -= padding.height;
                ownerW = containerSize.width;
                ownerH = containerSize.height;

                scrollbars = me.getScrollbarsNeeded(ownerW, ownerH, contentW, contentH);
                state.overflowState = scrollbars;

                if (typeof dimensions == 'number') {
                    scrollbars &= ~dimensions; // ignore dimensions that have no effect
                }

                overflowAdjust = {
                    width:  (xauto && (scrollbars & 2)) ? scrollbarSize.width : 0,
                    height: (yauto && (scrollbars & 1)) ? scrollbarSize.height : 0
                };

                // We can have 0-sized scrollbars (new Mac OS) and so don't invalidate
                // the layout unless this will change something...
                if (overflowAdjust.width !== me.lastOverflowAdjust.width || overflowAdjust.height !== me.lastOverflowAdjust.height) {
                    me.done = false;

                    // we pass overflowAdjust and overflowState in as state for the next
                    // cycle (these are discarded if one of our ownerCt's invalidates):
                    ownerContext.invalidate({
                        state: {
                            overflowAdjust: overflowAdjust,
                            overflowState: state.overflowState,
                            secondPass: true
                        }
                    });
                }
            }
        }

        if (!me.done) {
            return;
        }

        padElContext = ownerContext.padElContext ||
                      (ownerContext.padElContext = ownerContext.getEl('overflowPadderEl', me));

        // Even if overflow does not effect the layout, we still do need the padEl to be
        // sized or hidden appropriately...
        if (padElContext) {
            scrollbars = state.overflowState; // the true overflow state
            padWidth = ownerContext.peek('contentWidth');
            // the padder element must have a height of at least 1px, or its width will be ignored by the container.
            // The extra height is adjusted for by adding a -1px top margin to the padder element
            padHeight = 1;

            if (scrollbars) {
                padding = targetContext.getPaddingInfo();
                scrollRangeFlags = me.scrollRangeFlags;

                if ((scrollbars & 2) && (scrollRangeFlags & 1)) { // if (vscroll and loses bottom)
                    padHeight += padding.bottom;
                }

                if ((scrollbars & 1) && (scrollRangeFlags & 4)) { // if (hscroll and loses right)
                    padWidth += padding.right;
                }
                padElContext.setProp('display', '');
                padElContext.setSize(padWidth, padHeight);
            } else {
                padElContext.setProp('display', 'none');
            }
        }
    },

    completeLayout: function (ownerContext) {
        // Cache the scrollbar adjustment
        this.lastOverflowAdjust = ownerContext.state.overflowAdjust;
    },

    /**
     * Creates an element that makes bottom/right body padding consistent across browsers.
     * This element is sized based on the need for scrollbars in {@link #calculateOverflow}.
     * If the {@link #manageOverflow} option is false, this element is not created.
     *
     * See {@link #getScrollRangeFlags} for more details.
     */
    doRenderPadder: function (out, renderData) {
        // Careful! This method is bolted on to the renderTpl so all we get for context is
        // the renderData! The "this" pointer is the renderTpl instance!

        var me = renderData.$layout,
            owner = me.owner,
            scrollRangeFlags = me.getScrollRangeFlags();

        if (me.manageOverflow) {
            if (scrollRangeFlags & 5) { // if (loses parent bottom and/or right padding)
                out.push('<div id="',owner.id,'-overflowPadderEl" ',
                    // the padder element must have a height of at least 1px, or its width will be ignored by the container.
                    // The extra height is adjusted for by adding a -1px top margin to the padder element
                    // A side effect of this approach is that click events will not register on bottom 1px of the container's
                    // last child item, unless that item has a bottom margin.  To fix this we make the padder element
                    // relatively positioned and give it a large negative z-index.  -99999 seems sufficient.
                    'style="font-size: 1px; height: 1px; margin-top: -1px; position: relative; z-index: -99999');

                out.push('"></div>');

                me.scrollRangeFlags = scrollRangeFlags; // remember for calculateOverflow
            }
        }
    },

    /**
     * Returns the container size (that of the target). Only the fixed-sized dimensions can
     * be returned because the shrinkWrap dimensions are based on the contentWidth/Height
     * as determined by the container layout.
     *
     * If the {@link #calculateOverflow} method is used and if {@link #manageOverflow} is
     * true, this may adjust the width/height by the size of scrollbars.
     * 
     * @param {Ext.layout.ContextItem} ownerContext The owner's context item.
     * @param {Boolean} [inDom=false] True if the container size must be in the DOM.
     * @param {Boolean} [ignoreOverflow=true] if true scrollbar size will not be 
     * subtracted from container size.
     * @return {Object} The size
     * @return {Number} return.width The width
     * @return {Number} return.height The height
     * @protected
     */
    getContainerSize : function(ownerContext, inDom, ignoreOverflow) {
        // Subtle But Important:
        // 
        // We don't want to call getProp/hasProp et.al. unless we in fact need that value
        // for our results! If we call it and don't need it, the layout manager will think
        // we depend on it and will schedule us again should it change.

        var targetContext = ownerContext.targetContext,
            frameInfo = targetContext.getFrameInfo(),
            // if we're managing padding the padding is on the innerCt instead of the targetEl
            padding = targetContext.getPaddingInfo(),
            got = 0,
            needed = 0,
            overflowAdjust = ignoreOverflow ?  null : ownerContext.state.overflowAdjust,
            gotWidth, gotHeight, width, height;

        // In an shrinkWrap width/height case, we must not ask for any of these dimensions
        // because they will be determined by contentWidth/Height which is calculated by
        // this layout...

        // Fit/Card layouts are able to set just the width of children, allowing child's
        // resulting height to autosize the Container.
        // See examples/tabs/tabs.html for an example of this.

        if (!ownerContext.widthModel.shrinkWrap) {
            ++needed;
            width = inDom ? targetContext.getDomProp('width') : targetContext.getProp('width');
            gotWidth = (typeof width == 'number');
            if (gotWidth) {
                ++got;
                width -= frameInfo.width + padding.width;
                if (overflowAdjust) {
                    width -= overflowAdjust.width;
                }
            }
        }

        if (!ownerContext.heightModel.shrinkWrap) {
            ++needed;
            height = inDom ? targetContext.getDomProp('height') : targetContext.getProp('height');
            gotHeight = (typeof height == 'number');
            if (gotHeight) {
                ++got;
                height -= frameInfo.height + padding.height;
                if (overflowAdjust) {
                    height -= overflowAdjust.height;
                }
            }
        }

        return {
            width: width,
            height: height,
            needed: needed,
            got: got,
            gotAll: got == needed,
            gotWidth: gotWidth,
            gotHeight: gotHeight
        };
    },

    /**
     * returns the overflow-x style of the render target
     * @protected
     * @param {Ext.layout.ContextItem} ownerContext
     * @return {String}
     */
    getOverflowXStyle: function(ownerContext) {
        var me = this;

        return me.overflowXStyle ||
            (me.overflowXStyle = me.owner.scrollFlags.overflowX || ownerContext.targetContext.getStyle('overflow-x'));
    },

    /**
     * returns the overflow-y style of the render target
     * @protected
     * @param {Ext.layout.ContextItem} ownerContext
     * @return {String}
     */
    getOverflowYStyle: function(ownerContext) {
        var me = this;

        return me.overflowYStyle || 
            (me.overflowYStyle = me.owner.scrollFlags.overflowY || ownerContext.targetContext.getStyle('overflow-y'));
    },

    /**
     * Returns flags indicating cross-browser handling of scrollHeight/Width. In particular,
     * IE has issues with padding-bottom in a scrolling element (it does not include that
     * padding in the scrollHeight). Also, margin-bottom on a child in a scrolling element
     * can be lost.
     * 
     * All browsers seem to ignore margin-right on children and padding-right on the parent
     * element (the one with the overflow)
     * 
     * This method returns a number with the follow bit positions set based on things not
     * accounted for in scrollHeight and scrollWidth:
     *
     *  - 1: Scrolling element's padding-bottom is not included in scrollHeight.
     *  - 2: Last child's margin-bottom is not included in scrollHeight.
     *  - 4: Scrolling element's padding-right is not included in scrollWidth.
     *  - 8: Child's margin-right is not included in scrollWidth.
     *
     * To work around the margin-bottom issue, it is sufficient to create a 0px tall last
     * child that will "hide" the margin. This can also be handled by wrapping the children
     * in an element, again "hiding" the margin. Wrapping the elements is about the only
     * way to preserve their right margins. This is the strategy used by Column layout.
     *
     * To work around the padding-bottom problem, since it is comes from a style on the
     * parent element, about the only simple fix is to create a last child with height
     * equal to padding-bottom. To preserve the right padding, the sizing element needs to
     * have a width that includes the right padding.
     */
    getScrollRangeFlags: (function () {
        var flags = -1;

        return function () {
            if (flags < 0) {
                var div = Ext.getBody().createChild({
                        //cls: 'x-border-box x-hide-offsets',
                        cls: Ext.baseCSSPrefix + 'border-box',
                        style: {
                            width: '100px', height: '100px', padding: '10px',
                            overflow: 'auto'
                        },
                        children: [{
                            style: {
                                border: '1px solid red',
                                width: '150px', height: '150px',
                                margin: '0 5px 5px 0' // TRBL
                            }
                        }]
                    }),
                    scrollHeight = div.dom.scrollHeight,
                    scrollWidth = div.dom.scrollWidth,
                    heightFlags = {
                        // right answer, nothing missing:
                        175: 0,
                        // missing parent padding-bottom:
                        165: 1,
                        // missing child margin-bottom:
                        170: 2,
                        // missing both
                        160: 3
                    },
                    widthFlags = {
                        // right answer, nothing missing:
                        175: 0,
                        // missing parent padding-right:
                        165: 4,
                        // missing child margin-right:
                        170: 8,
                        // missing both
                        160: 12
                    };

                flags = (heightFlags[scrollHeight] || 0) | (widthFlags[scrollWidth] || 0);
                //Ext.log('flags=',flags.toString(2));
                div.remove();
            }

            return flags;
        };
    }()),

    initLayout: function() {
        var me = this,
            scrollbarWidth = Ext.getScrollbarSize().width;

        me.callParent();

        // Create a default lastOverflowAdjust based upon scrolling configuration.
        // If the Container is to overflow, or we *always* reserve space for a scrollbar
        // then reserve space for a vertical scrollbar
        if (scrollbarWidth && me.manageOverflow && !me.hasOwnProperty('lastOverflowAdjust')) {
            if (me.owner.scrollFlags.y || me.reserveScrollbar) {
                me.lastOverflowAdjust = {
                    width: scrollbarWidth,
                    height: 0
                };
            }
        }
    },

    setupRenderTpl: function (renderTpl) {
        this.callParent(arguments);

        renderTpl.renderPadder = this.doRenderPadder;
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

Ext.example = function(){
    var msgCt;

    function createBox(t, s){
       // return ['<div class="msg">',
       //         '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
       //         '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
       //         '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
       //         '</div>'].join('');
       return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
    }
    return {
        msg : function(title, format){
            if(!msgCt){
                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
            }
            var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
            var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
            m.hide();
            m.slideIn('t').ghost("t", { delay: 1000, remove: true});
        },

        init : function(){
            if(!msgCt){
                // It's better to create the msg-div here in order to avoid re-layouts 
                // later that could interfere with the HtmlEditor and reset its iFrame.
                msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
            }
//            var t = Ext.get('exttheme');
//            if(!t){ // run locally?
//                return;
//            }
//            var theme = Cookies.get('exttheme') || 'aero';
//            if(theme){
//                t.dom.value = theme;
//                Ext.getBody().addClass('x-'+theme);
//            }
//            t.on('change', function(){
//                Cookies.set('exttheme', t.getValue());
//                setTimeout(function(){
//                    window.location.reload();
//                }, 250);
//            });
//
//            var lb = Ext.get('lib-bar');
//            if(lb){
//                lb.show();
//            }
        }
    };
}();


Ext.onReady(Ext.example.init, Ext.example);


Ext.example.shortBogusMarkup = '<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Sed metus nibh, '+
    'sodales a, porta at, vulputate eget, dui. Pellentesque ut nisl. Maecenas tortor turpis, interdum non, sodales '+
    'non, iaculis ac, lacus. Vestibulum auctor, tortor quis iaculis malesuada, libero lectus bibendum purus, sit amet '+
    'tincidunt quam turpis vel lacus. In pellentesque nisl non sem. Suspendisse nunc sem, pretium eget, cursus a, fringilla.</p>';

Ext.example.bogusMarkup = '<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Sed metus nibh, sodales a, '+
    'porta at, vulputate eget, dui. Pellentesque ut nisl. Maecenas tortor turpis, interdum non, sodales non, iaculis ac, '+
    'lacus. Vestibulum auctor, tortor quis iaculis malesuada, libero lectus bibendum purus, sit amet tincidunt quam turpis '+
    'vel lacus. In pellentesque nisl non sem. Suspendisse nunc sem, pretium eget, cursus a, fringilla vel, urna.<br/><br/>'+
    'Aliquam commodo ullamcorper erat. Nullam vel justo in neque porttitor laoreet. Aenean lacus dui, consequat eu, adipiscing '+
    'eget, nonummy non, nisi. Morbi nunc est, dignissim non, ornare sed, luctus eu, massa. Vivamus eget quam. Vivamus tincidunt '+
    'diam nec urna. Curabitur velit. Lorem ipsum dolor sit amet.</p>';


// old school cookie functions
var Cookies = {};
Cookies.set = function(name, value){
     var argv = arguments;
     var argc = arguments.length;
     var expires = (argc > 2) ? argv[2] : null;
     var path = (argc > 3) ? argv[3] : '/';
     var domain = (argc > 4) ? argv[4] : null;
     var secure = (argc > 5) ? argv[5] : false;
     document.cookie = name + "=" + escape (value) +
       ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) +
       ((path == null) ? "" : ("; path=" + path)) +
       ((domain == null) ? "" : ("; domain=" + domain)) +
       ((secure == true) ? "; secure" : "");
};

Cookies.get = function(name){
	var arg = name + "=";
	var alen = arg.length;
	var clen = document.cookie.length;
	var i = 0;
	var j = 0;
	while(i < clen){
		j = i + alen;
		if (document.cookie.substring(i, j) == arg)
			return Cookies.getCookieVal(j);
		i = document.cookie.indexOf(" ", i) + 1;
		if(i == 0)
			break;
	}
	return null;
};

Cookies.clear = function(name) {
  if(Cookies.get(name)){
    document.cookie = name + "=" +
    "; expires=Thu, 01-Jan-70 00:00:01 GMT";
  }
};

Cookies.getCookieVal = function(offset){
   var endstr = document.cookie.indexOf(";", offset);
   if(endstr == -1){
       endstr = document.cookie.length;
   }
   return unescape(document.cookie.substring(offset, endstr));
};

Ext.define('Ext.app.ChartPortlet', {

    extend:  Ext.panel.Panel ,
    alias: 'widget.chartportlet',

               
                             
                               
                                  
                                
                                
      

    generateData: function(){
        var data = [{
                name: 0,
                djia: 10000,
                sp500: 1100
            }],
            i;
        for (i = 1; i < 50; i++) {
            data.push({
                name: i,
                sp500: data[i - 1].sp500 + ((Math.floor(Math.random() * 2) % 2) ? -1 : 1) * Math.floor(Math.random() * 7),
                djia: data[i - 1].djia + ((Math.floor(Math.random() * 2) % 2) ? -1 : 1) * Math.floor(Math.random() * 7)
            });
        }
        return data;
    },

    initComponent: function(){

        Ext.apply(this, {
            layout: 'fit',
            height: 300,
            items: {
                xtype: 'chart',
                animate: false,
                shadow: false,
                store: Ext.create('Ext.data.JsonStore', {
                    fields: ['name', 'sp500', 'djia'],
                    data: this.generateData()
                }),
                legend: {
                    position: 'bottom'
                },
                axes: [{
                    type: 'Numeric',
                    position: 'left',
                    fields: ['djia'],
                    title: 'Dow Jones Average',
                    label: {
                        font: '11px Arial'
                    }
                }, {
                    type: 'Numeric',
                    position: 'right',
                    grid: false,
                    fields: ['sp500'],
                    title: 'S&P 500',
                    label: {
                            font: '11px Arial'
                        }
                }],
                series: [{
                    type: 'line',
                    lineWidth: 1,
                    showMarkers: false,
                    fill: true,
                    axis: 'left',
                    xField: 'name',
                    yField: 'djia',
                    style: {
                        'stroke-width': 1,
                        stroke: 'rgb(148, 174, 10)'

                    }
                }, {
                    type: 'line',
                    lineWidth: 1,
                    showMarkers: false,
                    axis: 'right',
                    xField: 'name',
                    yField: 'sp500',
                    style: {
                        'stroke-width': 1,
                         stroke: 'rgb(17, 95, 166)'

                    }
                }]
            }
        });

        this.callParent(arguments);
    }
});

Ext.define('Ext.app.GridPortlet', {
    extend:  Ext.grid.Panel ,
    alias: 'widget.gridportlet',
           
                             
      
    height: 300,
    myData: [
        ['3m Co',                               71.72, 0.02,  0.03,  '9/1 12:00am'],
        ['Alcoa Inc',                           29.01, 0.42,  1.47,  '9/1 12:00am'],
        ['Altria Group Inc',                    83.81, 0.28,  0.34,  '9/1 12:00am'],
        ['American Express Company',            52.55, 0.01,  0.02,  '9/1 12:00am'],
        ['American International Group, Inc.',  64.13, 0.31,  0.49,  '9/1 12:00am'],
        ['AT&T Inc.',                           31.61, -0.48, -1.54, '9/1 12:00am'],
        ['Boeing Co.',                          75.43, 0.53,  0.71,  '9/1 12:00am'],
        ['Caterpillar Inc.',                    67.27, 0.92,  1.39,  '9/1 12:00am'],
        ['Citigroup, Inc.',                     49.37, 0.02,  0.04,  '9/1 12:00am'],
        ['E.I. du Pont de Nemours and Company', 40.48, 0.51,  1.28,  '9/1 12:00am'],
        ['Exxon Mobil Corp',                    68.1,  -0.43, -0.64, '9/1 12:00am'],
        ['General Electric Company',            34.14, -0.08, -0.23, '9/1 12:00am'],
        ['General Motors Corporation',          30.27, 1.09,  3.74,  '9/1 12:00am'],
        ['Hewlett-Packard Co.',                 36.53, -0.03, -0.08, '9/1 12:00am'],
        ['Honeywell Intl Inc',                  38.77, 0.05,  0.13,  '9/1 12:00am'],
        ['Intel Corporation',                   19.88, 0.31,  1.58,  '9/1 12:00am'],
        ['International Business Machines',     81.41, 0.44,  0.54,  '9/1 12:00am'],
        ['Johnson & Johnson',                   64.72, 0.06,  0.09,  '9/1 12:00am'],
        ['JP Morgan & Chase & Co',              45.73, 0.07,  0.15,  '9/1 12:00am'],
        ['McDonald\'s Corporation',             36.76, 0.86,  2.40,  '9/1 12:00am'],
        ['Merck & Co., Inc.',                   40.96, 0.41,  1.01,  '9/1 12:00am'],
        ['Microsoft Corporation',               25.84, 0.14,  0.54,  '9/1 12:00am'],
        ['Pfizer Inc',                          27.96, 0.4,   1.45,  '9/1 12:00am'],
        ['The Coca-Cola Company',               45.07, 0.26,  0.58,  '9/1 12:00am'],
        ['The Home Depot, Inc.',                34.64, 0.35,  1.02,  '9/1 12:00am'],
        ['The Procter & Gamble Company',        61.91, 0.01,  0.02,  '9/1 12:00am'],
        ['United Technologies Corporation',     63.26, 0.55,  0.88,  '9/1 12:00am'],
        ['Verizon Communications',              35.57, 0.39,  1.11,  '9/1 12:00am'],
        ['Wal-Mart Stores, Inc.',               45.45, 0.73,  1.63,  '9/1 12:00am']
    ],

    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    change: function(val) {
        if (val > 0) {
            return '<span style="color:green;">' + val + '</span>';
        } else if (val < 0) {
            return '<span style="color:red;">' + val + '</span>';
        }
        return val;
    },

    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    pctChange: function(val) {
        if (val > 0) {
            return '<span style="color:green;">' + val + '%</span>';
        } else if (val < 0) {
            return '<span style="color:red;">' + val + '%</span>';
        }
        return val;
    },

    initComponent: function(){

        var store = Ext.create('Ext.data.ArrayStore', {
            fields: [
               {name: 'company'},
               {name: 'change',     type: 'float'},
               {name: 'pctChange',  type: 'float'}
            ],
            data: this.myData
        });

        Ext.apply(this, {
            //height: 300,
            height: this.height,
            store: store,
            stripeRows: true,
            columnLines: true,
            columns: [{
                id       :'company',
                text   : 'Company',
                //width: 120,
                flex: 1,
                sortable : true,
                dataIndex: 'company'
            },{
                text   : 'Change',
                width    : 75,
                sortable : true,
                renderer : this.change,
                dataIndex: 'change'
            },{
                text   : '% Change',
                width    : 75,
                sortable : true,
                renderer : this.pctChange,
                dataIndex: 'pctChange'
            }]
        });

        this.callParent(arguments);
    }
});

/**
 * @class Ext.app.Portlet
 * @extends Ext.panel.Panel
 * A {@link Ext.panel.Panel Panel} class that is managed by {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.Portlet', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.portlet',
    layout: 'fit',
    anchor: '100%',
    frame: true,
    closable: true,
    collapsible: true,
    animCollapse: true,
    draggable: {
        moveOnDrag: false    
    },
    cls: 'x-portlet',

    // Override Panel's default doClose to provide a custom fade out effect
    // when a portlet is removed from the portal
    doClose: function() {
        if (!this.closing) {
            this.closing = true;
            this.el.animate({
                opacity: 0,
                callback: function(){
                    var closeAction = this.closeAction;
                    this.closing = false;
                    this.fireEvent('close', this);
                    this[closeAction]();
                    if (closeAction == 'hide') {
                        this.el.setOpacity(1);
                    }
                },
                scope: this
            });
        }
    }
});

/**
 * @class Ext.app.PortalColumn
 * @extends Ext.container.Container
 * A layout column class used internally be {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.PortalColumn', {
    extend:  Ext.container.Container ,
    alias: 'widget.portalcolumn',

               
                                      
                         
      

    layout: 'anchor',
    defaultType: 'portlet',
    cls: 'x-portal-column'

    // This is a class so that it could be easily extended
    // if necessary to provide additional behavior.
});

/**
 * @class Ext.app.PortalDropZone
 * @extends Ext.dd.DropTarget
 * Internal class that manages drag/drop for {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.PortalDropZone', {
    extend:  Ext.dd.DropTarget ,

    constructor: function(portal, cfg) {
        this.portal = portal;
        Ext.dd.ScrollManager.register(portal.body);
        Ext.app.PortalDropZone.superclass.constructor.call(this, portal.body, cfg);
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },

    ddScrollConfig: {
        vthresh: 50,
        hthresh: -1,
        animate: true,
        increment: 200
    },

    createEvent: function(dd, e, data, col, c, pos) {
        return {
            portal: this.portal,
            panel: data.panel,
            columnIndex: col,
            column: c,
            position: pos,
            data: data,
            source: dd,
            rawEvent: e,
            status: this.dropAllowed
        };
    },

    notifyOver: function(dd, e, data) {
        var xy = e.getXY(),
            portal = this.portal,
            proxy = dd.proxy;

        // case column widths
        if (!this.grid) {
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = portal.body.dom.clientWidth;
        if (!this.lastCW) {
            // set initial client width
            this.lastCW = cw;
        } else if (this.lastCW != cw) {
            // client width has changed, so refresh layout & grid calcs
            this.lastCW = cw;
            //portal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var colIndex = 0,
            colRight = 0,
            cols = this.grid.columnX,
            len = cols.length,
            cmatch = false;

        for (len; colIndex < len; colIndex++) {
            colRight = cols[colIndex].x + cols[colIndex].w;
            if (xy[0] < colRight) {
                cmatch = true;
                break;
            }
        }
        // no match, fix last index
        if (!cmatch) {
            colIndex--;
        }

        // find insert position
        var overPortlet, pos = 0,
            h = 0,
            match = false,
            overColumn = portal.items.getAt(colIndex),
            portlets = overColumn.items.items,
            overSelf = false;

        len = portlets.length;

        for (len; pos < len; pos++) {
            overPortlet = portlets[pos];
            h = overPortlet.el.getHeight();
            if (h === 0) {
                overSelf = true;
            } else if ((overPortlet.el.getY() + (h / 2)) > xy[1]) {
                match = true;
                break;
            }
        }

        pos = (match && overPortlet ? pos : overColumn.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, colIndex, overColumn, pos);

        if (portal.fireEvent('validatedrop', overEvent) !== false && portal.fireEvent('beforedragover', overEvent) !== false) {

            // make sure proxy width is fluid in different width columns
            proxy.getProxy().setWidth('auto');
            if (overPortlet) {
                dd.panelProxy.moveProxy(overPortlet.el.dom.parentNode, match ? overPortlet.el.dom : null);
            } else {
                dd.panelProxy.moveProxy(overColumn.el.dom, null);
            }

            this.lastPos = {
                c: overColumn,
                col: colIndex,
                p: overSelf || (match && overPortlet) ? pos : false
            };
            this.scrollPos = portal.body.getScroll();

            portal.fireEvent('dragover', overEvent);
            return overEvent.status;
        } else {
            return overEvent.status;
        }

    },

    notifyOut: function() {
        delete this.grid;
    },

    notifyDrop: function(dd, e, data) {
        delete this.grid;
        if (!this.lastPos) {
            return;
        }
        var c = this.lastPos.c,
            col = this.lastPos.col,
            pos = this.lastPos.p,
            panel = dd.panel,
            dropEvent = this.createEvent(dd, e, data, col, c, pos !== false ? pos : c.items.getCount());

        if (this.portal.fireEvent('validatedrop', dropEvent) !== false && 
            this.portal.fireEvent('beforedrop', dropEvent) !== false) {

            Ext.suspendLayouts();
            
            // make sure panel is visible prior to inserting so that the layout doesn't ignore it
            panel.el.dom.style.display = '';
            dd.panelProxy.hide();
            dd.proxy.hide();

            if (pos !== false) {
                c.insert(pos, panel);
            } else {
                c.add(panel);
            }

            Ext.resumeLayouts(true);

            this.portal.fireEvent('drop', dropEvent);

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;
            if (st) {
                var d = this.portal.body.dom;
                setTimeout(function() {
                    d.scrollTop = st;
                },
                10);
            }
        }
        
        delete this.lastPos;
        return true;
    },

    // internal cache of body and column coords
    getGrid: function() {
        var box = this.portal.body.getBox();
        box.columnX = [];
        this.portal.items.each(function(c) {
            box.columnX.push({
                x: c.el.getX(),
                w: c.el.getWidth()
            });
        });
        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg: function() {
        Ext.dd.ScrollManager.unregister(this.portal.body);
        Ext.app.PortalDropZone.superclass.unreg.call(this);
    }
});

/**
 * @class Ext.app.PortalPanel
 * @extends Ext.panel.Panel
 * A {@link Ext.panel.Panel Panel} class used for providing drag-drop-enabled portal layouts.
 */
Ext.define('Ext.app.PortalPanel', {
    extend:  Ext.panel.Panel ,
    alias: 'widget.portalpanel',

               
                                      

                                 
                              
      

    cls: 'x-portal',
    bodyCls: 'x-portal-body',
    defaultType: 'portalcolumn',
    autoScroll: true,

    manageHeight: false,

    initComponent : function() {
        var me = this;

        // Implement a Container beforeLayout call from the layout to this Container
        this.layout = {
            type : 'column'
        };
        this.callParent();

        this.addEvents({
            validatedrop: true,
            beforedragover: true,
            dragover: true,
            beforedrop: true,
            drop: true
        });
    },

    // Set columnWidth, and set first and last column classes to allow exact CSS targeting.
    beforeLayout: function() {
        var items = this.layout.getLayoutItems(),
            len = items.length,
            firstAndLast = ['x-portal-column-first', 'x-portal-column-last'],
            i, item, last;

        for (i = 0; i < len; i++) {
            item = items[i];
            item.columnWidth = 1 / len;
            last = (i == len-1);

            if (!i) { // if (first)
                if (last) {
                    item.addCls(firstAndLast);
                } else {
                    item.addCls('x-portal-column-first');
                    item.removeCls('x-portal-column-last');
                }
            } else if (last) {
                item.addCls('x-portal-column-last');
                item.removeCls('x-portal-column-first');
            } else {
                item.removeCls(firstAndLast);
            }
        }

        return this.callParent(arguments);
    },

    // private
    initEvents : function(){
        this.callParent();
        this.dd = Ext.create('Ext.app.PortalDropZone', this, this.dropConfig);
    },

    // private
    beforeDestroy : function() {
        if (this.dd) {
            this.dd.unreg();
        }
        this.callParent();
    }
});

/**
 * @class Ext.app.Portal
 * @extends Object
 * A sample portal layout application class.
 */

Ext.define('Ext.app.Portal', {

    extend:  Ext.container.Viewport ,
                                                                                                             

    getTools: function(){
        return [{
            xtype: 'tool',
            type: 'gear',
            handler: function(e, target, header, tool){
                var portlet = header.ownerCt;
                portlet.setLoading('Loading...');
                Ext.defer(function() {
                    portlet.setLoading(false);
                }, 2000);
            }
        }];
    },

    initComponent: function(){
        var content = '<div class="portlet-content">'+Ext.example.shortBogusMarkup+'</div>';

        Ext.apply(this, {
            id: 'app-viewport',
            layout: {
                type: 'border',
                padding: '0 5 5 5' // pad the layout from the window edges
            },
            items: [{
                id: 'app-header',
                xtype: 'box',
                region: 'north',
                height: 40,
                html: 'Ext Portal'
            },{
                xtype: 'container',
                region: 'center',
                layout: 'border',
                items: [{
                    id: 'app-options',
                    title: 'Options',
                    region: 'west',
                    animCollapse: true,
                    width: 200,
                    minWidth: 150,
                    maxWidth: 400,
                    split: true,
                    collapsible: true,
                    layout:{
                        type: 'accordion',
                        animate: true
                    },
                    items: [{
                        html: content,
                        title:'Navigation',
                        autoScroll: true,
                        border: false,
                        iconCls: 'nav'
                    },{
                        title:'Settings',
                        html: content,
                        border: false,
                        autoScroll: true,
                        iconCls: 'settings'
                    }]
                },{
                    id: 'app-portal',
                    xtype: 'portalpanel',
                    region: 'center',
                    items: [{
                        id: 'col-1',
                        items: [{
                            id: 'portlet-1',
                            title: 'Grid Portlet',
                            tools: this.getTools(),
                            items: Ext.create('Ext.app.GridPortlet'),
                            listeners: {
                                'close': Ext.bind(this.onPortletClose, this)
                            }
                        },{
                            id: 'portlet-2',
                            title: 'Portlet 2',
                            tools: this.getTools(),
                            html: content,
                            listeners: {
                                'close': Ext.bind(this.onPortletClose, this)
                            }
                        }]
                    },{
                        id: 'col-2',
                        items: [{
                            id: 'portlet-3',
                            title: 'Portlet 3',
                            tools: this.getTools(),
                            html: '<div class="portlet-content">'+Ext.example.bogusMarkup+'</div>',
                            listeners: {
                                'close': Ext.bind(this.onPortletClose, this)
                            }
                        }]
                    },{
                        id: 'col-3',
                        items: [{
                            id: 'portlet-4',
                            title: 'Stock Portlet',
                            tools: this.getTools(),
                            items: Ext.create('Ext.app.ChartPortlet'),
                            listeners: {
                                'close': Ext.bind(this.onPortletClose, this)
                            }
                        }]
                    }]
                }]
            }]
        });
        this.callParent(arguments);
    },

    onPortletClose: function(portlet) {
        this.showMsg('"' + portlet.title + '" was removed');
    },

    showMsg: function(msg) {
        var el = Ext.get('app-msg'),
            msgId = Ext.id();

        this.msgId = msgId;
        el.update(msg).show();

        Ext.defer(this.clearMsg, 3000, this, [msgId]);
    },

    clearMsg: function(msgId) {
        if (msgId === this.msgId) {
            Ext.get('app-msg').hide();
        }
    }
});


        Ext.Loader.setPath('Ext.app', 'classes');
    


                     
                                     
                                   
                                    
                                      
                                
                              
                                   
                                  
                              
                                     
                                  
                                  
           

        Ext.onReady(function(){
            Ext.create('Ext.app.Portal');
        });
    

//@tag page-portal
//@require ../../examples/shared/examples.js
//@require embedded-script-tag-1.js
//@require ../../examples/portal/portal.js
//@require embedded-script-tag-2.js

