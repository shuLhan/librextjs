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

Ext.define('AM.view.user.List' ,{
    extend:  Ext.grid.Panel ,
    alias : 'widget.userlist',

    title : 'All Users',
    store: 'Users',

    columns: [
        {header: 'Name',  dataIndex: 'name',  flex: 1},
        {header: 'Email', dataIndex: 'email', flex: 1}
    ]
});

Ext.define('AM.view.Viewport', {
    extend:  Ext.container.Viewport ,

    layout: 'fit',
    items: [{
        xtype: 'userlist'
    }]
});

Ext.define('AM.view.user.Edit', {
    extend:  Ext.window.Window ,
    alias : 'widget.useredit',

                                 

    title : 'Edit User',
    layout: 'fit',
    autoShow: true,
    width: 280,

    initComponent: function() {
        this.items = [
            {
                xtype: 'form',
                padding: '5 5 0 5',
                border: false,
                style: 'background-color: #fff;',

                items: [
                    {
                        xtype: 'textfield',
                        name : 'name',
                        fieldLabel: 'Name'
                    },
                    {
                        xtype: 'textfield',
                        name : 'email',
                        fieldLabel: 'Email'
                    }
                ]
            }
        ];

        this.buttons = [
            {
                text: 'Save',
                action: 'save'
            },
            {
                text: 'Cancel',
                scope: this,
                handler: this.close
            }
        ];

        this.callParent(arguments);
    }
});

Ext.define('AM.model.User', {
    extend:  Ext.data.Model ,

               
                              
      

    fields: ['id', 'name', 'email']
});

Ext.define('AM.store.Users', {
    extend:  Ext.data.Store ,
    model: 'AM.model.User',
    autoLoad: true,
    
    proxy: {
        type: 'ajax',
        api: {
            read: 'data/users.json',
            update: 'data/updateUsers.json'
        },
        reader: {
            type: 'json',
            root: 'users',
            successProperty: 'success'
        }
    }
});

Ext.define('AM.controller.Users', {
    extend:  Ext.app.Controller ,

    stores: [
        'Users@AM.store'
    ],

    models: [
        'User@AM.model'
    ],

    views: [
        'Edit@AM.view.user',
        'List@AM.view.user'
    ],

    refs: [
        {
            ref: 'usersPanel',
            selector: 'panel'
        }
    ],

    init: function() {
        this.control({
            'viewport > userlist': {
                itemdblclick: this.editUser
            },
            'useredit button[action=save]': {
                click: this.updateUser
            }
        });
    },

    editUser: function(grid, record) {
        var edit = Ext.create('AM.view.user.Edit').show();

        edit.down('form').loadRecord(record);
    },

    updateUser: function(button) {
        var win    = button.up('window'),
            form   = win.down('form'),
            record = form.getRecord(),
            values = form.getValues();

        record.set(values);
        win.close();
        this.getUsersStore().sync();
    }
});

Ext.application({
    name: 'AM',

    // automatically create an instance of AM.view.Viewport
    autoCreateViewport: true,

    controllers: [
        'Users'
    ]
});

//@tag page-simpleapp
//@require ../../examples/app/simple/app.js

