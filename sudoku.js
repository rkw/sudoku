$(function() {
    var ls = {
        getItem: function(key) {
            return JSON.parse(localStorage.getItem(key));
    	},
		
		setItem: function(key,value) {
			localStorage.setItem(key, JSON.stringify(value));
		}
	}
	
    window.Box = Backbone.Model.extend({
        defaults: {
            value: 0,                           //.. known value for cell
            guess: 0,
            cell: 0,                            //.. 0 to 80, going across
            show: 0                             //.. boolean: pop up is open
        },
        
        initialize: function() {
            // This is purposely left out of defaults so that all instances
            //.. of Box will not reference the same array
            this.set({possible: [0,1,1,1,1,1,1,1,1,1]});
        },
        
        guess: function(i) {
            this.set({guess: i, show: 0});
        },
        
        setValue: function(i) {
            if (i != 0) {
                this.set({value: i});
                this.set({possible: [0,0,0,0,0,0,0,0,0,0]});
            }
        },
        
        setPossible: function(poss) {
            var curr = this.get('possible');
            for (var i in poss) {
                // EXTREMELY important that the change is made on the curr 
                //.. array since poss is shared by the group
                curr[i] = curr[i] & poss[i];
            }
            
            if (_.compact(curr).length==1) {
                this.setValue(_.indexOf(curr,1));         
            } else {
                this.set({possible: curr});
            }        
        },
                
        getPossible: function() {
            return this.get('possible');
        }
    });
		
	window.BoxView = Backbone.View.extend({
		tagName: 'div',
		
		className: 'inline',
		
		template: _.template($('#box-template').html()),

        events: {
			'click' : 'toggleShow'
		},
		
		initialize: function() {
    		this.model.bind('change', _.bind(this.render, this));
    		this.model.bind('change:show', _.bind(this.renderShow, this));
		},
		
    	render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
	        
		renderShow: function(e) {
            $('ul.guesses').remove();   //.. remove all open instances

            if (this.model.get('show')) {
                var pop = '<ul class="guesses">';
                
                var poss = this.model.getPossible();
                for (var i in poss) {
                    if (poss[i]) {
                        pop += '<li value="' +i+ '">' +i+ '</li>';
                    }
                }
                pop += '<li value="0">clear</li></ul>';
    
                var divLoc = $(this.el).offset();
                $(pop).filter('ul.guesses')
                    .css({'top': divLoc.top - 25, 'left': divLoc.left + 25})
                    .hide()
                    .appendTo('body')
                    .fadeIn(500);
                    
                // Bind click event to the model's guess() method,
                //.. bind the scope of of guess() to the model,
                //.. pass in the li item value
                var thisView = this;
                $('ul.guesses li').click(function() {
                    _.bind(thisView.model.guess, thisView.model, $(this).val())();
                });
            }
		},
        
        toggleShow: function() {
            _.bind(Boxes.toggleShow, Boxes, this.model)();
        }	
	});
	
	window.BoxList = Backbone.Collection.extend({
		model: Box,
			
		done: function() {
			return this.filter(function(box) { return box.get('value') > 0; });
		},
		
		guessed: function() {
			return this.filter(function(box) { return box.get('guess') > 0; });
		},
		
		remaining: function() {
			return this.without.apply(this, this.done());
		},
        
        toggleShow: function(togglebox) {
            // Set all shown boxes and unshow them
            var shown = this.filter(function(box) {
                return (box != togglebox) && (box.get('show'));
            });
            _.each(shown, function(box) {
                box.set({show:0});
            });
            
            // Only show possibilities if the box's value is not known
            if (togglebox.get('value') == 0) {
                togglebox.set({show: !togglebox.get('show')});
            }
        }
	});
    
    window.Group = Backbone.Collection.extend({
        model: Box,
        
        values: function() {
            return _.compact(this.pluck('value'));
        },
        
        reduce: function() {
            var poss = [0,1,1,1,1,1,1,1,1,1];
            var knowns = this.values();
            for (var i in knowns) {
                poss[knowns[i]] = 0;
            }

            this.each(function(box) {
                if (box.get('value') == 0) {
                    box.setPossible(poss);
                }
            });
        }
    });
	
	window.AppView = Backbone.View.extend({
		el: $('#app'),
		
		statsTemplate: _.template($('#stats-template').html()),
		
		totalMoves: 0,
		
		events: {
			'click #loginname': 'promptName',
			'click #startgame': 'startGame',
            'click #solvegame': 'solveGame',
            'change #difficulty': 'startGame'
		},
		
		initialize: function() {
			this.displayName();
			this.$('#startgame').focus();
            Boxes.bind('change:guess', _.bind(this.updateGuesses, this));
            Boxes.bind('change:guess', _.bind(this.render, this));
            Boxes.bind('change:value', _.bind(this.render, this));
            Boxes.bind('change:value', _.bind(this.solveGame, this));
			Boxes.bind('add', _.bind(this.addBox, this));
		},
		
		render: function() {
			this.$('#stats').html(this.statsTemplate({
                done: Boxes.done().length,
				guessed: Boxes.guessed().length,
				remaining: Boxes.remaining().length
			}));
			this.renderGuesses();
		},
		
		renderGuesses: function() {
			this.$('#totalmoves').text('Total moves: ' + this.totalMoves);
		},

		updateGuesses: function() {
			this.totalMoves++;
			this.renderGuesses();
		},
		
		promptName: function() {
			ls.setItem('loginname', 
				(prompt("What is your name?") || '').trim() || ls.getItem('loginname')
			);
			this.displayName();	
		},
		
		displayName: function() {
			$('#loginname').text(
				ls.getItem('loginname') || '{Click to Enter Name}'
			);
		},
		
		startGame: function() {
			this.$('#board').empty().hide();
			this.totalMoves = 0;
			Boxes.reset();
			$('ul.guesses').remove();	//.. close all 'guess' popups

            var defData = [	4,0,0,0,0,0,0,5,9,
	                        3,0,0,0,5,0,6,0,4,
	                        0,1,0,0,0,8,0,0,0,
	                        7,0,0,8,0,3,0,6,0,
	                        0,0,0,0,0,0,0,0,0,
	                        0,5,0,9,0,4,0,0,7,
	                        0,0,0,3,0,0,0,2,0,
	                        2,0,6,0,8,0,0,0,3,
	                        9,7,0,0,0,0,0,0,8];
         
         	var thisView = this;
         	var content = $('<div></div>');
         	var url = 'sudoku-data?level=' + $('#difficulty').val();
           	content.load(url + ' #puzzle_grid', function(res, status, xmlReq) {
           		if (status != 'error') {
	       			var gamedata = content.find('input').map(function() {
						return parseInt($(this).val() ||  0);
					}).toArray();
					thisView.loadData(gamedata);           			
           		} else {
           			thisView.loadData(defData);
           		}
       		});
		},
        
        loadData: function(data) {
            // Set all 81 boxes
    		for (var i in data) {
                var box = new Box({cell:i});
                box.setValue(data[i]);
				Boxes.add(box);
			}
            
            // Create 27 groups: 9 horizotal rows, 9 vertical rows, 9 sections
            for (var i=0; i<27; i++) {
                Groups[i] = new Group;
            }
            
            var arr = [];   //.. hold box indexes for the groups
            
            // Indexes for horizontal rows
            for (var i=0; i<9; i++) {
                arr[i] = _.range(i*9, (i*9)+9, 1);
            }

            // Indexes for vertical rows
            for (var i=0; i<9; i++) {
                arr[i+9] = _.range(i, i+(9*9), 9);
            }
            
            // Indexes for sections
            for (var i=18; i<27; i++) {
                arr[i] = [];
            }
            for (var i=0; i<3; i++) {
                for (var j=0; j<3; j++) {
                    arr[18].push( (0+j) + (i*9) );
                    arr[19].push( (3+j) + (i*9) );
                    arr[20].push( (6+j) + (i*9) );
                    arr[21].push( (27+j) + (i*9) );
                    arr[22].push( (30+j) + (i*9) );
                    arr[23].push( (33+j) + (i*9) );
                    arr[24].push( (54+j) + (i*9) );
                    arr[25].push( (57+j) + (i*9) );
                    arr[26].push( (60+j) + (i*9) );
                }
            }

            // Add boxes to groups
            for (var i in Groups) {
                for (var j in arr[i]) {
                    Groups[i].add(Boxes.at(arr[i][j]));
                }
            }
            
    		this.render();
    		this.$('#board').fadeIn(1500);
        },
        
        solveGame: function() {
            for (var i in Groups) {
                _.bind(Groups[i].reduce, Groups[i])();
            }
        },
		
		addBox: function(box) {
			var view = new BoxView({model: box});
			$('#board').append(view.render().el);
		},
		
		promptNewGame: function() {
		 	if ( confirm('Congratulations ' + ls.getItem('loginname') + '!\nYou solved it in ' + this.totalClicks + ' clicks.\n\n'+ 'Continue to new game?') ) {
				this.startGame();
		 	}
		}
	});
	
    window.Groups = [];
	window.Boxes = new BoxList;		
	window.appview = new AppView;
});