/*
 *
 * WorldIsland.js
 * Generates island world.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/env/WorldIsland.js",
		_WorldIsland = {},
		_World,
        _Game,
		_Model,
		_Physics,
		_Field,
		_Farming,
		_ObjectMaker,
		_Water,
		_Sky;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _WorldIsland,
		requirements: [
			"assets/modules/core/Game.js",
			"assets/modules/env/World.js",
			"assets/modules/core/Model.js",
			"assets/modules/core/Physics.js",
			"assets/modules/utils/ObjectMaker.js",
			"assets/modules/env/Water.js",
			"assets/modules/env/Sky.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal ( g, world, m, physics, om, w, sky ) {
		console.log('internal world island');
		
		// assets
		
		_Game = g;
		_World = world;
		_Model = m;
		_Physics = physics;
		_ObjectMaker = om;
		_Water = w;
		_Sky = sky;
		
		_WorldIsland.Instance = WorldIsland;
		_WorldIsland.Instance.prototype = new _World.Instance();
		_WorldIsland.Instance.prototype.constructor = _WorldIsland.Instance;
		
	}
	
	/*===================================================
    
    world
    
    =====================================================*/
    
    function WorldIsland ( parameters ) {
    	
    	var me = this;
    	
    	// prototype constructor
		
		_World.Instance.call( me, parameters );
		
		// public
		
		me.show = show;
		me.hide = hide;
		
		/*===================================================
		
		environment
		
		=====================================================*/
    	
    	// skybox
		
		me.parts.skybox = _ObjectMaker.make_skybox( shared.pathToTextures + "skybox_world" );
    	
    	// world base
    	
    	me.parts.body = new _Model.Instance();
		
		me.parts.body.quaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -Math.PI * 0.4 );
		
		me.add( me.parts.body );
		
		// ambient
		
		me.parts.ambientLight = new THREE.AmbientLight( 0x999999 );
		
		me.add( me.parts.ambientLight );
		
		// fog
		
		me.parts.fog = null;//new THREE.Fog( 0x226fb3, 1, 10000 );
		
		// body parts
		
        me.parts.head = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Whale_Head.js"),
			physics: {
				bodyType: 'mesh'
			}
        });
		
		me.parts.body.add( me.parts.head );
		
		me.parts.tail = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Whale_Tail.js"),
			physics: {
				bodyType: 'mesh'
			}
        });
		
		me.parts.body.add( me.parts.tail );
		
		// water
		
		me.parts.waterRing = new _Water.Instance( { wavesTexture: shared.pathToTextures + "water_world_512.png" } );
		
		me.add( me.parts.waterRing );
		
		/*===================================================
		
		sky
		
		=====================================================*/
		
		// sun/moon
		
		me.parts.sunmoon = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Sun_Moon.js"),
			materials: new THREE.MeshBasicMaterial( { shading: THREE.NoShading, vertexColors: THREE.VertexColors } ),
			physics: {
				bodyType: 'mesh'
			}
        });
		
		me.parts.sunmoon.position.set( 0, 4000, 0 );
		me.parts.sunmoon.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI );
		
		_Physics.rotate_relative_to_source( me.parts.sunmoon, me.parts.body, shared.cardinalAxes.forward.clone().negate(), shared.cardinalAxes.up );
		
		me.add( me.parts.sunmoon );
		
		// sun light
		
		me.parts.sunmoonLight = new THREE.PointLight( 0xffffff, 1, 10000 );
		
		me.parts.sunmoon.add( me.parts.sunmoonLight );
		
		// sky
		
		me.parts.sky = new _Sky.Instance( {
			world: me.parts.body,
			numClouds: 20,
			cloudBoundRadius: 5000,
			cloudDistanceFromSurfaceMin: me.parts.sunmoon.position.length() - 2000,
			cloudDistanceFromSurfaceMax: me.parts.sunmoon.position.length() + 500,
			zones: [
				{
					polar: {
						min: Math.PI * 0.15,
						max: Math.PI * 0.85
					},
					azimuth: {
						min: Math.PI * 0.15,
						max: Math.PI * 0.4
					}
				},
				{
					polar: {
						min: Math.PI * 0.15,
						max: Math.PI * 0.85
					},
					azimuth: {
						min: Math.PI * 0.6,
						max: Math.PI * 0.85
					}
				}
			]
		} );
		
		me.add( me.parts.sky );
		
		/*===================================================
		
		home
		
		=====================================================*/
		
		me.parts.home = new _Model.Instance();
		
		me.parts.body.add( me.parts.home );
		
		// hill for home
		
		me.parts.hill = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Hut_Hill.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.home.add( me.parts.hill );
		
		// steps
		
		me.parts.steps = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Hut_Steps.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.home.add( me.parts.steps );	
		
		// hut
		
		me.parts.hut = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Hut.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.home.add( me.parts.hut );
		
		// banana leaf door
		
		me.parts.bananaLeafDoor = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Banana_Leaf_Door.js"),
			center: true,
			doubleSided: true
        });
		
		me.parts.home.add( me.parts.bananaLeafDoor );
		
		// surfboard
		
		me.parts.surfboard = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Surfboard.js"),
			center: true
        });
		
		me.parts.home.add( me.parts.surfboard );	
		
		/*===================================================
		
		volcano
		
		=====================================================*/
		
		me.parts.volcano = new _Model.Instance();
		
		me.parts.body.add( me.parts.volcano );
		
		// volcano large
		
		me.parts.volcanoLarge = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Large.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoLarge );
		
		// volcano small
		
		me.parts.volcanoSmall = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Small.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoSmall );
		
		// volcano rocks
		
		me.parts.volcanoRocks001 = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Rocks_001.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoRocks001 );
		
		me.parts.volcanoRocks002 = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Rocks_002.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoRocks002 );
		
		me.parts.volcanoRocks003 = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Rocks_003.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoRocks003 );
		
		me.parts.volcanoRocks004 = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Rocks_004.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoRocks004 );
		
		me.parts.volcanoRocks005 = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Volcano_Rocks_005.js"),
			physics: {
				bodyType: 'mesh'
			},
			center: true
        });
		
		me.parts.volcano.add( me.parts.volcanoRocks005 );
		
		/*===================================================
		
		trees
		
		=====================================================*/
		
		me.parts.trees = new _Model.Instance();
		
		me.parts.body.add( me.parts.trees );
		
		// kukui trees
		
		me.parts.kukuiTrees = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Kukui_Trees.js"),
        });
		
		me.parts.trees.add( me.parts.kukuiTrees );
		
		// palm trees
		
		me.parts.palmTrees = new _Model.Instance({
            geometry: main.get_asset_data("assets/models/Palm_Trees.js"),
        });
		
		me.parts.trees.add( me.parts.palmTrees );
		
		/*===================================================
		
		fields
		
		=====================================================*/
		
		main.asset_require( [
				"assets/modules/farming/Field.js",
				"assets/modules/farming/Farming.js"
			],
			init_fields,
			true
		);
		
		function init_fields ( fld, frm ) {
			
			_Field = fld;
			_Farming = frm;
			
			// tutorial
			
			me.parts.fieldTutorial = new _Field.Instance( {
				id: 'Tutorial',
				geometry: main.get_asset_data("assets/models/Field_Tutorial.js"),
				physics: {
					bodyType: 'mesh'
				},
				grid: {
					modulesGeometry: main.get_asset_data("assets/models/Field_Tutorial_Grid.js")
				},
				numElementsMin: 0,
				rewards: [
					{
						image: shared.pathToIcons + 'plant_rev_64.png',
						label: 'New Plant!',
						callback: _Farming.give_plants,
						context: _Farming,
						data: 'taro_003'
					}
				]
			});
			
			me.parts.body.add( me.parts.fieldTutorial );
			
			// basics split
			
			me.parts.fieldBasicsSplit = new _Field.Instance( {
				id: 'Split',
				geometry: main.get_asset_data("assets/models/Field_Basics_Split.js"),
				physics: {
					bodyType: 'mesh'
				},
				/*grid: {
					modulesGeometry: main.get_asset_data("assets/models/Field_Basics_Split_Grid.js")
				},
				numElementsMin: 10,
				hints: [
					'Some plants will only grow when next to certain other plants!',
					'Some fields are split into smaller parts. Fields are much easier to solve if you think this way!'
				],
				hintsCombine: true,
				rewards: [
					{
						image: shared.pathToIcons + 'plant_rev_64.png',
						label: 'New Plant!',
						callback: _Farming.give_plants,
						context: _Farming,
						data: 'pineapple_001'
					}
				]*/
			});
			
			me.parts.body.add( me.parts.fieldBasicsSplit );
			
			// basics abilities
			
			me.parts.fieldBasicsAbilities = new _Field.Instance( {
				id: 'Abilities',
				geometry: main.get_asset_data("assets/models/Field_Basics_Abilities.js"),
				physics: {
					bodyType: 'mesh'
				},
				grid: {
					modulesGeometry: main.get_asset_data("assets/models/Field_Basics_Abilities_Grid.js")
				},
				numElementsMin: 10,
				hints: [
					'Some plants have special abilities that will help solve puzzles!'
				],
				hintsCombine: true,
				rewards: [
					{
						image: shared.pathToIcons + 'plant_rev_64.png',
						label: 'New Plant!',
						callback: _Farming.give_plants,
						context: _Farming,
						data: 'rock'
					},
					false,
					{
						image: shared.pathToIcons + 'plant_rev_64.png',
						label: 'New Plant!',
						callback: _Farming.give_plants,
						context: _Farming,
						data: 'pineapple_001'
					}
				]
			});
			
			me.parts.body.add( me.parts.fieldBasicsAbilities );
			
		}
		
		// functions
		
		/*===================================================
		
		show / hide
		
		=====================================================*/
		
		function show ( scene ) {
			
			// proto
			
			_World.Instance.prototype.show.call( me, scene );
			
			// skybox
			
			_Game.sceneBG.add( me.parts.skybox );
			
			// morph animations
			
			me.parts.tail.morphs.play( 'swim', { duration: 5000, loop: true } );
			
			me.parts.sunmoon.morphs.play( 'shine', { duration: 500, loop: true, reverseOnComplete: true, durationShift: 4000 } );
	
			me.parts.sunmoon.morphs.play( 'bounce', { duration: 3000, loop: true, loopDelay: 4000, loopChance: 0.1 } );
			
			me.parts.waterRing.morphs.play( 'waves', { duration: 4000, loop: true } );
			
			me.parts.sky.animate();
			
		}
		
		function hide () {
			
			// proto
			
			_World.Instance.prototype.hide.call( me );
			
			// skybox
			
			_Game.sceneBG.remove( me.parts.skybox );
			
			// morphs
			
			me.parts.tail.morphs.stopAll();
			
			me.parts.sunmoon.morphs.stopAll();
			
			me.parts.waterRing.morphs.stopAll();
			
			me.parts.sky.animate( { stop: true } );
			
		}
    	
    }
	
} ( KAIOPUA ) );