/************************************************************************
*   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
*   - Following objects defined
* 		- w2toolbar 	- toolbar widget
*		- $.w2toolbar	- jQuery wrapper
*   - Dependencies: jQuery, w2utils
* 
************************************************************************/

(function () {
	var w2toolbar = function (options) {
		this.box		= null,		// DOM Element that holds the element
		this.name 		= null,		// unique name for w2ui
		this.items 		= [],
		this.right 		= '',		// HTML text on the right of toolbar
		this.onClick 	= null,
		this.onRender 	= null, 
		this.onRefresh	= null,
		this.onResize   = null,
		this.onDestroy  = null
	
		$.extend(true, this, options);
	}
	
	
	// ====================================================
	// -- Registers as a jQuery plugin
	
	$.fn.w2toolbar = function(method) {
		if (typeof method === 'object' || !method ) {
			// check required parameters
			if (!method || typeof method.name == 'undefined') {
				$.error('The parameter "name" is required but not supplied in $().w2toolbar().');
				return;
			}
			if (typeof w2ui[method.name] != 'undefined') {
				$.error('The parameter "name" is not unique. There are other objects already created with the same name (obj: '+ method.name +').');
				return;			
			}
			var items = method.items;
			// extend items
			var object = new w2toolbar(method);
			$.extend(object, { items: [], handlers: [] });
			
			for (var i in items) { object.items[i] = $.extend({}, w2toolbar.prototype.item, items[i]); }		
			if ($(this).length != 0) {
				object.box = $(this)[0];
				$(this).data('w2name', object.name);
				object.render();
			}
			// register new object
			w2ui[object.name] = object;
			return object;
			
		} else if (typeof $(this).data('w2name') != 'undefined') {
			var obj = w2ui[$(this).data('w2name')];
			obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
			return this;
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.w2toolbar' );
		}    
	};
	
	// ====================================================
	// -- Implementation of core functionality
	
	w2toolbar.prototype = {
		item: {
			id: 			null,		// commnad to be sent to all event handlers
			type: 			'button',	// button, check, radio, drop, menu, break, html, spacer
			caption: 		'',
			html: 			'', 
			img: 			'',	
			hidden: 		false,
			disabled: 		false,
			arrow: 			true,		// arrow down for drop/menu types
			hint: 			'',
			group: 			null, 		// used for radio buttons
			items: 			null, 		// for type menu it is an array of items in the menu
			checked: 		false, 		// used for radio buttons
			onClick: 		null
		},
	
		add: function (items) {
			this.insert(null, items);
		},
		
		insert: function (id, items) {
			if (!$.isArray(items)) items = [items];
			for (var o in items) {
				// checks
				if (typeof items[o].type == 'undefined') {
					$.error('The parameter "type" is required but not supplied in w2toolbar.add() method.');
					return;
				}
				if ($.inArray(String(items[o].type), ['button', 'check', 'radio', 'drop', 'menu', 'break', 'html', 'spacer']) == -1) {
					$.error('The parameter "type" should be one of the following [button, check, radio, drop, menu, break, html, spacer] '+
							'in w2toolbar.add() method.');
					return;
				}
				if (typeof items[o].id == 'undefined') {
					$.error('The parameter "id" is required but not supplied in w2toolbar.add() method.');
					return;
				}
				var unique = true;
				for (var i = 0; i < this.items.length; i++) { if (this.items[i].id == items[o].id) { unique = false; return; } }
				if (!unique) {
					$.error('The parameter "id" is not unique within the current toolbar.');
					return;
				}
				if (!w2utils.isAlphaNumeric(items[o].id)) {
					$.error('The parameter "id" must be alpha-numeric + "-_".');
					return;
				}
				// add item
				var it = $.extend({}, w2toolbar.prototype.item, items[o]);
				if (id == null || typeof id == 'undefined') {
					this.items.push(it);
				} else {
					var middle = this.getIndex(id);
					this.items = this.items.slice(0, middle).concat([it], this.items.slice(middle));
				}		
				this.refresh(items[o].id);
			}
		},
		
		remove: function (id) {
			var removed = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				removed++;
				// remove from screen
				$(this.box).find('.w2ui-toolbar #'+ this.name +'_item_'+ it.id).remove();
				// remove from array
				var ind = this.getIndex(it.id);
				if (ind) this.items.splice(ind, 1);
			}
			return removed;
		},
		
		set: function (id, options) {
			var item = this.getIndex(id);
			if (item == null) return false;
			$.extend(this.items[item], options);
			this.refresh(id);
			return true;	
		},
		
		get: function (id) {
			var item = null;
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i].id == id) { item = this.items[i]; break; }
			}
			return item;	
		},
		
		getIndex: function (id) {
			var index = null;
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i].id == id) { return i; }
			}
			return index;
		},
		
		show: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.hidden = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		hide: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.hidden = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		enable: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.disabled = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		disable: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.disabled = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		check: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.checked = true;
				this.refresh(it.id);
			}
			return items;
		},
		
		uncheck: function (id) {
			var items = 0;
			for (var a in arguments) {
				var it = this.get(arguments[a]);
				if (!it) continue;
				items++;
				it.checked = false;
				this.refresh(it.id);
			}
			return items;
		},
		
		render: function (box) {
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'render', target: this.name, box: box });	
			if (eventData.stop === true) return false;
	 
			if (typeof box != 'undefined' && box != null) { 
				$(this.box).html(''); 
				this.box = box;
			}
			if (!this.box) return;
			// render all buttons
			$(this.box).html('');
            var divKey = "div#" + this.name + "_toolbar" + ".w2ui-reset.w2ui-toolbar";
            var divObj = {};
            divObj[divKey] = "";
            var divEl = json2html(divObj);
            var tableEl = json2html({
                "table": {
                    "cellspacing": "0",
                    "cellpadding": "0",
                    width: "100%"
                }
            });
            $(divEl).append(tableEl);
            var row = json2html({
                "tr": ""
            });
            for(var i = 0; i < this.items.length; i++) {
                var it = this.items[i];
                if (it == null) continue;
                var addStyle = '';
                if(it.hidden) { addStyle += 'display: none;' }
                if(it.disabled) { addStyle += "opacity: 0.2; -moz-opacity: 0.2; -webkit-opacity: 0.2; -o-opacity: 0.2; filter: alpha(opacity=20);";}
                var elObj = {};
                if(it.type == 'spacer') {
                    var spacerKey = "td#" + this.name + "_item_" + it.id;
                    elObj[spacerKey] = {
                        "align": "right"
                    };
                    //then do something...
                } else {
                    var tdKey = "td#" + this.name + "_item_" + it.id;
                    elObj[tdKey] = {
                        style: addStyle,
                        valign: "middle"
                    };
                }
                //render as an HTML element
                var tdEl = json2html(elObj);
                //append the innerHTML
                var inner = this.getItemHTML(it);
                if(typeof inner === 'object' && inner.length) {
                    inner.forEach(function(el) {
                        $(tdEl).append(el);
                    });
                } else {
                    $(tdEl).append(inner);
                }
                //now add the td to the tr
                $(row).append(tdEl);
            }
            //finally append the row to the table
            $(tableEl).append(row);

            //at this point should be an element already
			$(this.box).append(divEl);
			// append global drop-box that can be on top of everything
			if ($('#w2ui-global-drop').length == 0) $('body').append('<div id="w2ui-global-drop" class="w2ui-reset"></div>');
			// event after
			this.trigger($.extend({ phase: 'after' }));	
		},
		
		refresh: function (id) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'refresh', target: (typeof id != 'undefined' ? id : this.name), item: this.get(id) });	
			if (eventData.stop === true) return false;
			
			if (typeof id == 'undefined') {
				// refresh all
				for (var i = 0; i < this.items.length; i++) this.refresh(this.items[i].id);
			}
			// create or refresh only one item
			var it = this.get(id);
			if (it == null) return;
			
			var jq_el = $(this.box).find('.w2ui-toolbar #'+ this.name +'_item_'+ it.id);
			var html  = this.getItemHTML(it);
			if (jq_el.length == 0) {
				// does not exist - create it
				var addStyle = '';
				if (it.hidden) { addStyle += 'display: none;'; }
				if (it.disabled) { addStyle += 'opacity: 0.2; -moz-opacity: 0.2; -webkit-opacity: 0.2; -o-opacity: 0.2; filter:alpha(opacity=20);'; }
				html = '<td id="'+ this.name + '_item_'+ it.id +'" style="'+ addStyle +'" valign="middle">'+ html + '</td>';
				if (this.getIndex(id) == this.items.length-1) {
					$(this.box).find('.w2ui-toolbar #'+ this.name +'_right').before(html);
				} else {
					$(this.box).find('.w2ui-toolbar #'+ this.name +'_item_'+ this.items[parseInt(this.getIndex(id))+1].id).before(html);
				}
			} else {
				// refresh
				jq_el.html(html);
				if (it.hidden) { jq_el.css('display', 'none'); }
							else { jq_el.css('display', ''); }
				if (it.disabled) { jq_el.css({ 'opacity': '0.2', '-moz-opacity': '0.2', '-webkit-opacity': '0.2', '-o-opacity': '0.2', 'filter': 'alpha(opacity=20)' }); }
							else { jq_el.css({ 'opacity': '1', '-moz-opacity': '1', '-webkit-opacity': '1', '-o-opacity': '1', 'filter': 'alpha(opacity=100)' }); }
			}
			// event after
			this.trigger($.extend({ phase: 'after' }));	
		},
		
		resize: function (width, height, immediate) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'resize', target: this.name });	
			if (eventData.stop === true) return false;

			// empty function

			// event after
			this.trigger($.extend({ phase: 'after' }));	
		},
	
		destroy: function () { 
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'destroy', target: this.name });	
			if (eventData.stop === true) return false;
			// clean up
			$(this.box).html('');
			delete w2ui[this.name];
			// event after
			this.trigger($.extend({ phase: 'after' }));	
		},
		
		// ========================================
		// --- Internal Functions
		
		getMenuHTML: function (item) { 
			var menu_html = "<table cellspacing=\"0\" style=\"padding: 5px 0px;\">";
            var menuObj = {
                "table": {
                    "cellspacing": "0",
                    style: "padding: 5px 0px;"
                }
            };
            var menuEl = json2html(menuObj);
			for (var f = 0; f < item.items.length; f++) { 
				if (typeof item.items[f] == 'string') {
					var tmp = item.items[f].split('|');
					if (typeof tmp[2] == 'undefined') tmp[2] = tmp[0];
				} else {
					var tmp = [];
					// text == caption
					if (typeof item.items[f].text  == 'undefined' && typeof item.items[f].caption != 'undefined') item.items[f].text = item.items[f].caption;
					// icon == img
					if (typeof item.items[f].icon  == 'undefined' && typeof item.items[f].img != 'undefined') item.items[f].icon = item.items[f].img;
					// value == id == cmd
					if (typeof item.items[f].value == 'undefined' && typeof item.items[f].id != 'undefined')  item.items[f].value = item.items[f].id;
					if (typeof item.items[f].value == 'undefined' && typeof item.items[f].cmd != 'undefined') item.items[f].value = item.items[f].cmd;
					tmp[0] = item.items[f].text;
					tmp[1] = item.items[f].icon;
					tmp[2] = typeof item.items[f].value != 'undefined' ? item.items[f].value : item.items[f].text;
				}
                var rowObj = {
                    tr: {
                        style: "cursor: default;"
                    }
                }
                var row = json2html(rowObj);
                var name = this.name,
                    id = item.id;
                $(row).mouseover(function() {
                    $(this).addClass('w2ui-selected');
                });
                $(row).mouseout(function() {
                    $(this).removeClass('w2ui-selected');
                });
                $(row).click(function() {
                    var obj = w2ui[name];
                    obj.doDropOut(id,0);
                    obj.doClick(id, event, f);
                });
                var divKey = "div";
                if(typeof tmp[1] != 'undefined') {
                    divKey += "." + tmp[1] + ".w2ui-icon";
                }
                var tdObj = {
                        td: {
                            style: "padding: 3px 3px 3px 6px"
                        }
                }
                tdObj['td'][divKey] = "";
                $(row).append(json2html(tdObj));
           
                $(row).append(json2html({
                    td: {
                        style: "padding: 3px 10px 3px 3px",
                        html: tmp[0]
                    }
                }));
                $(menuEl).append(row);
            }
                return menuEl;
		},
		
		getItemHTML: function (item) {
			var html = '';
			
			if (item.caption == null) item.caption = '';
			if (item.img == null) item.img = '';
			var transparent = 'transparent';
			var addToText   = '';
			
			if (item.img != '') {
				if (w2utils.engine == 'IE5') {
					if (item.disabled) {
						addToText   = "FILTER: alpha(opacity=20);";
						butPicture  = 'src="'+ item.img +'" style="FILTER: alpha(opacity=20);"';
					} else {
						butPicture  = 'src="images/empty.gif" style="Filter:Progid:DXImageTransform.Microsoft.AlphaImageLoader(src='+ item.img + ', opacity=20)"';
					}
				} else {
					butPicture  = 'src="'+ item.img +'"';
				}
			}
			if (typeof item.hint == 'undefined') item.hint = '';
	
			switch (item.type) {
				case 'menu':
                    var menuEl = this.getMenuHTML(item);
                    item.html = menuEl;
				case 'button':	
				case 'check':
				case 'radio':
				case 'drop':
                    var tableObj = {};
                    var tableKey = "table.w2ui-tab0"/* + (item.checked ? ".checked" : "");*/
                    tableObj[tableKey] = {
                            cellpadding: "0",
                            cellspacing: "0",
                            title: item.hint
                    };
                    var tableEl = json2html(tableObj);
                    //pull out some values for scope purposes
                    var name = this.name,
                        id = item.id;
                    //create listeners by attaching them to the element
                    $(tableEl).mouseover(function() {
                        var el = w2ui[name];
                        if(el) el.doOver(id,event);
                    });
                    $(tableEl).mouseout(function() {
                        var el = w2ui[name];
                        if(el) el.doOut(id,event);
                    });
                    $(tableEl).mousedown(function() {
                        var el = w2ui[name];
                        if(el) el.doDown(id,event);
                    });
                    $(tableEl).mouseup(function() {
                        var el = w2ui[name];
                        if(el) el.doClick(id,event);
                    });

                    var subObj = {};
                    var subKey = "table.w2ui-tab1" /*+ item.checked ? ".checked" : "";*/
                    subObj[subKey] = {
                        cellpadding: "1",
                        cellspacing:"0"
                    };
                    var subEl = json2html(subObj);
                    var tr = json2html({"tr": ""});
                    subEl.appendChild(tr);
                    //image
                    if(item.img != '') {
                        var imageObj = {};
                        var imageKey = "div.w2ui-tb-image.w2ui-icon." + item.img;
                        imageObj[imageKey] = {}; 
                    }
                    tr.appendChild(json2html({
                        "td" : item.img != '' ? json2html(imageObj) : " "
                    }));
                    //caption
                    if(item.caption != '') {
                        var captionObj = {};
                        var captionKey = "td.w2ui-tb-caption";
                        captionObj[captionKey] = {
                            style: addToText,
                            nowrap: "",
                            html: item.caption
                        }; 
                        tr.appendChild(json2html(captionObj));
                    }
                    //down?
					if((item.type == 'drop' || item.type == 'menu') && item.arrow !== false) {
                        tr.appendChild(json2html({
                            "td.w2ui-tb-down": {
                                html: "   ",
                                nowrap: ""
                            }
                        }));
                    } 
                    var tbody = json2html({tbody: ""});
                    var td = json2html({td: ""});
                    td.appendChild(subEl);
                    var tr = json2html({tr: ""});
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                    tableEl.appendChild(tbody);
										break;
								
				case 'break':
                    var elObj = {
                        table: {
                            td: {
                                "div.w2ui-break": " "
                            }
                        }
                };
                    var tableEl = json2html(elObj);

					break;
	
				case 'html':
                    var td = json2html({
                        "td": {
                          nowrap: ""
                        }
                    });
                    td.appendChild(item.html);
                    var elObj = {
                        table: {
                            cellpadding: "0",
                            cellspacing: "0",
                            style: "height: 22px; margin-top: 2px; " + addToText
                        }
                    };
                    var tableEl = json2html(elObj);
                    tableEl.appendChild(td);
					break;
			}
			// drop div
            
            var dropEl = json2html({"div.w2ui-drop-box": ""});
            var els = [tableEl,dropEl];
			
			var newHTML = '';
			if (typeof item.onRender == 'function') newHTML = item.onRender.call(this, item.id, els);
			if (typeof this.onRender == 'function') newHTML = this.onRender(item.id, els);
			if (newHTML != '' && typeof newHTML != 'undefined') els = newHTML;
			return els;					
		},
		
		doOver: function (id) {
			var it = this.get(id);
			if (it && !it.disabled) {
				$('#'+ this.name +'_item_'+ it.id + ' table').addClass('over');
				
				if (it.type == 'drop' || it.type == 'menu') { clearTimeout(it.timer); }
			}
		},
		
		doOut: function (id, timeout) {
			var it = this.get(id);
			if (typeof timeout == 'undefined') timeout = 400;
			if (it && !it.disabled) {
				$('#'+ this.name +'_item_'+ it.id + ' table').removeClass('over');
	
				if (it.type == 'drop' || it.type == 'menu') { // hide drop
					var obj = this;
					it.timer = setTimeout( function () {
						var el  = w2ui[obj.name];
						var btn = it; 
						$('#'+ this.name +'_item_'+ btn.id + ' div.w2ui-drop-box').hide();
						if ($('#w2ui-global-drop').data('tb-id') == btn.id) $('#w2ui-global-drop').hide();
						btn.checked = false;
						obj.refresh(btn.id);
					}, timeout);
				}
			}
		},
		
		doDown: function (id) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			var it = this.get(id);
			if (it && !it.disabled) {
				$('#'+ this.name +'_item_'+ it.id + ' table').addClass('down');
				// drop items
				if (it.type == 'drop' || it.type == 'menu') {
					if (!it.checked) {
						$('table.w2ui-toolbar div.w2ui-drop-box').hide();
						$('#'+ this.name +'_item_'+ it.id + ' div.w2ui-drop-box').show();
						if ($('#w2ui-global-drop').data('tb-id') == it.id) $('#w2ui-global-drop').hide();
						$('#w2ui-global-drop').css({
							left: $('#'+ this.name +'_item_'+ it.id + ' div.w2ui-drop-box').offset().left + 'px',
							top: $('#'+ this.name +'_item_'+ it.id + ' div.w2ui-drop-box').offset().top + 'px'
						}).html(it.html).show().data('tb-id', it.id);
						// events
						var obj = this;
						$('#w2ui-global-drop').unbind('mouseover').unbind('mouseout');
						$('#w2ui-global-drop').bind('mouseover', function (evt) {
							var el = w2ui[obj.name]; 
							if (el) el.doDropOver(it.id);
						});
						$('#w2ui-global-drop').bind('mouseout', function (evt) {
							var el = w2ui[obj.name]; 
							if (el) el.doDropOut(it.id);
						});
					} else {
						$('#'+ this.name +'_item_'+ it.id + ' div.w2ui-drop-box').hide();
						if ($('#w2ui-global-drop').data('tb-id') == it.id) $('#w2ui-global-drop').hide();
					}
				}
			}
		},
		
		doDropOver: function (id) {
			var it = this.get(id);
			clearTimeout(it.timer);
		},
		
		doDropOut: function (id, timeout) {
			var it  = this.get(id);
			var obj = this;
			if (typeof timeout == 'undefined') timeout = 400;
			if (typeof id === 'undefined') {
				for (var i = 0; i < this.items.length; i++) {
					var it = this.items[i];
					if (it.type == 'drop' || it.type == 'menu') { it.checked = false; this.refresh(it.id); }
					$('#'+ this.name +'_item_'+ this.items[i].id +' div.w2ui-drop-box').hide();
					if ($('#w2ui-global-drop').data('tb-id') == this.items[i].id) $('#w2ui-global-drop').hide();
				} 
			} else {	
				it.timer = setTimeout( function () {
					var el  = w2ui[obj.name];
					var btn = it; 
					$('#'+ this.name +'_item_'+ btn.id + ' div.w2ui-drop-box').hide();
					if ($('#w2ui-global-drop').data('tb-id') == btn.id) $('#w2ui-global-drop').hide();
					btn.checked = false;
					obj.refresh(btn.id);
				}, timeout);
			}
		},
		
		doClick: function (id, event, menu_index) {
			if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection 
			var it = this.get(id);
			if (it && !it.disabled) {
				// event before
				var eventData = this.trigger({ phase: 'before', type: 'click', target: (typeof id != 'undefined' ? id : this.name), item: this.get(id),
					  subItem: (typeof menu_index != 'undefined' && this.get(id) ? this.get(id).items[menu_index] : null), event: event });	
				if (eventData.stop === true) return false;
			
				$('#'+ this.name +'_item_'+ it.id + ' table').removeClass('down');
				
				for (var i = 0; i < this.items.length; i++) {
					if (this.items[i].hideTimer) { clearTimeout(this.items[i].hideTimer); }
				}
				
				if (it.type == 'radio') {
					for (var i = 0; i < this.items.length; i++) {
						var itt = this.items[i];
						if (itt == null || itt.id == it.id || itt.type != 'radio') continue;
						if (itt.group == it.group && itt.checked) {
							itt.checked = false;
							this.refresh(itt.id);
						}
					}
					it.checked = true;
					$('#'+ this.name +'_item_'+ it.id + ' table').addClass('checked');					
				}
				if (it.type == 'check' || it.type == 'drop' || it.type == 'menu') {
					it.checked = !it.checked;
					if (it.checked) {
						$('#'+ this.name +'_item_'+ it.id + ' table').addClass('checked');
					} else {
						$('#'+ this.name +'_item_'+ it.id + ' table').removeClass('checked');					
					}
				}
				// event after
				this.trigger($.extend({ phase: 'after' }));	
			}
		}	
	}
	
	$.extend(w2toolbar.prototype, $.w2event);
	w2obj.w2toolbar = w2toolbar;
})();
