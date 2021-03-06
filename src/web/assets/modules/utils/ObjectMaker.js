/*
 *
 * ObjectMaker.js
 * Handles generation of misc objects.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/utils/ObjectMaker.js",
		_ObjectMaker = {},
		_Model;
    
    /*===================================================
    
    public properties
    
    =====================================================*/
	
    _ObjectMaker.make_skybox = make_skybox;
	
	main.asset_register( assetPath, { 
		data: _ObjectMaker,
		requirements: [
			"assets/modules/core/Model.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal ( m ) {
		console.log('internal objectmaker');
		_Model = m;
		
	}

    /*===================================================
    
    maker functions
    
    =====================================================*/
    
    // generates a skybox from array of images
    
    function make_skybox ( imagesAssetPath, mapping, instance ) {
		
		var textureCube,
			shader,
			material;
		
		instance = instance || {};
		
		// get images from assets
		
		ap = imagesAssetPath;
		
		// cube texture
		
		textureCube = new THREE.Texture( null, mapping );
		
		main.asset_require( [ 
			ap + "_posx.jpg",
			ap + "_negx.jpg",
			ap + "_posy.jpg",
			ap + "_negy.jpg",
			ap + "_posz.jpg",
			ap + "_negz.jpg"
		], function ( posx, negx, posy, negy, posz, negz ) {
			
			textureCube.image = [ posx, negx, posy, negy, posz, negz ];
			textureCube.needsUpdate = true;
			
		} );
		
		// shader
		
		shader = $.extend(true, {}, THREE.ShaderUtils.lib[ "cube" ]);
		shader.uniforms[ "tCube" ].texture = textureCube;
		
		// material
		
		material = new THREE.ShaderMaterial( {

			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false
			
		} );
		
		// instance
		
		instance = new _Model.Instance( {
            geometry: new THREE.CubeGeometry( 100, 100, 100 ),
			materials: material,
			shading: THREE.SmoothShading,
			flipSided: true
        }, instance );
        
        return instance;
        
    }
    
} ( KAIOPUA ) );