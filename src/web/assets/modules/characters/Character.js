/*
 *
 * Character.js
 * Adds additional functionality to basic model.
 *
 * @author Collin Hover / http://collinhover.com/
 *
 */
(function (main) {
    
    var shared = main.shared = main.shared || {},
		assetPath = "assets/modules/characters/Character.js",
		_Character = {},
		_Model,
		_MathHelper,
		characterIDBase = 'kaiopua_character',
		utilQ1Rotate;
	
	/*===================================================
    
    public properties
    
    =====================================================*/
	
	main.asset_register( assetPath, { 
		data: _Character,
		requirements: [
			"assets/modules/core/Game.js",
			"assets/modules/core/Model.js",
			"assets/modules/utils/MathHelper.js"
		],
		callbacksOnReqs: init_internal,
		wait: true
	});
	
	/*===================================================
    
    internal init
    
    =====================================================*/
	
	function init_internal ( g, m, mh ) {
		console.log('internal character', _Character);
		// modules
		
		_Game = g;
		_Model = m;
		_MathHelper = mh;
		
		// utility
		
		utilQ1Rotate = new THREE.Quaternion();
		
		// character instance
		
		_Character.Instance = Character;
		_Character.Instance.prototype = new _Model.Instance();
		_Character.Instance.prototype.constructor = _Character.Instance;
		_Character.Instance.prototype.move_state_change = move_state_change;
		_Character.Instance.prototype.rotate_by_delta = rotate_by_delta;
		_Character.Instance.prototype.morph_cycle = morph_cycle;
		_Character.Instance.prototype.action = action;
		_Character.Instance.prototype.add_action = add_action;
		_Character.Instance.prototype.stop_action = stop_action;
		_Character.Instance.prototype.get_is_performing_action = get_is_performing_action;
		_Character.Instance.prototype.show = show;
		_Character.Instance.prototype.hide = hide;
		_Character.Instance.prototype.update = update;
		_Character.Instance.prototype.update_followers = update_followers;
		
		Object.defineProperty( _Character.Instance.prototype, 'scene', { 
			get : function () { return this._scene; },
			set : function ( newScene ) {
				
				if ( typeof newScene !== 'undefined' ) {
					
					// remove from previous
					
					this.hide();
					
					// add to new
					
					this.show( newScene );
					
				}
				
			}
		});
		
	}
	
	/*===================================================
    
    character
    
    =====================================================*/
	
	// adds functionality to and inherits from Model
	
	function Character ( parameters ) {
		
		var me = this,
			parametersModel,
			parametersMovement,
			movement,
			move,
			rotate,
			jump,
			state;
		
		// handle parameters
		
		parameters = parameters || {};
		
		// model
		
		parametersModel = parameters.model || {};
		
		// physics
		
		if ( typeof parametersModel.physics !== 'undefined' ) {
			
			parametersModel.physics.dynamic = true;
			parametersModel.physics.movementDamping = parametersModel.physics.movementDamping || 0.5;
			
		}
		
		// prototype constructor
		
		_Model.Instance.call( me, parametersModel );
		
		// movement
		
		parametersMovement = parameters.movement || {};
		
		movement = me.movement = {};
		
		// move
		
		move = movement.move = {};
		move.speed = parametersMovement.moveSpeed || 6;
		move.speedBack = parametersMovement.moveSpeedBack || move.speed;
		move.runThreshold = parametersMovement.moveRunThreshold || 0;
		move.walkAnimationTime = parametersMovement.moveWalkAnimationTime || 750;
		move.runAnimationTime = parametersMovement.moveRunAnimationTime || 500;
		move.idleAnimationTime = parametersMovement.moveIdleAnimationTime || 3000;
		move.morphClearTime = parametersMovement.moveCycleClearTime || 125;
		move.animationChangeTimeThreshold = parametersMovement.animationChangeTimeThreshold || 0;
		move.animationChangeTimeTotal = move.animationChangeTimeThreshold;
		move.direction = new THREE.Vector3();
		move.vector = new THREE.Vector3();
		
		// rotate
		rotate = me.movement.rotate = {};
		rotate.speed = parametersMovement.rotateSpeed || 0.015;
		rotate.direction = new THREE.Vector3();
		rotate.delta = new THREE.Quaternion();
		rotate.vector = new THREE.Quaternion();
		
		// jump
		jump = me.movement.jump = {};
		jump.speedStart = parametersMovement.jumpSpeedStart || 6;
		jump.speedEnd = parametersMovement.jumpSpeedEnd || 0;
		jump.timeTotal = 0;
		jump.timeMax = parametersMovement.jumpTimeMax || 50;
		jump.timeAfterNotGrounded = 0;
		jump.timeAfterNotGroundedMax = 125;
		jump.startDelay = parametersMovement.jumpStartDelay || 125;
		jump.startDelayTime = 0;
		jump.animationTime = parametersMovement.jumpAnimationTime || 1000;
		jump.startAnimationTime = parametersMovement.jumpStartAnimationTime || jump.startDelay;
		jump.endAnimationTime = parametersMovement.jumpEndAnimationTime || move.morphClearTime;
		jump.ready = true;
		jump.active = false;
		
		// state
		state = me.movement.state = {};
		state.up = 0;
		state.down = 0;
		state.left = 0;
		state.right = 0;
		state.forward = 0;
		state.back = 0;
		state.turnleft = 0;
		state.turnright = 0;
		state.grounded = false;
		state.groundedLast = false;
		state.moving = false;
		state.movingBack = false;
		state.moveType = '';
		
		// properties
		
		me.id = parameters.id || characterIDBase;
		
		me.actions = {};
		me.actionsNames = [];
		
		me.showing = false;
		
		me.followers = [];
		
		me.targeting = {
			
			targets: [],
			targetsToRemove: [],
			targetCurrent: undefined
			
		};
		
	}
	
	/*===================================================
	
	actions
	
	=====================================================*/
	
	function action ( actionName, parameters ) {
		
		var action;
		
		// if action type is in actions map, do it
		if ( this.actions.hasOwnProperty( actionName ) ) {
			
			action = this.actions[ actionName ];
			
			if ( typeof action.callback === 'function' ) {
				
				action.callback.call( action.context, parameters );
				
			}
			
		}
		
	}
	
	function add_action () {
		
		var i, l,
			j, k,
			parameters,
			actionsNames,
			actionName;
		
		for ( i = 0, l = arguments.length; i < l; i++ ) {
			
			parameters = arguments[ i ];
			
			if ( main.type( parameters ) === 'object' ) {
				
				actionsNames = main.ensure_array( parameters.actionsNames );
				
				// for each action name
				
				for ( j = 0, k = actionsNames.length; j < k; j++ ) {
					
					actionName = actionsNames[ j ];
					
					// add to actions map
					
					this.actions[ actionName ] = {
						callback: parameters.callback,
						context: parameters.context || this,
						activeCheck: parameters.activeCheck,
						activeCheckContext: parameters.activeCheckContext || this
					};
					
					// store name
					
					if ( this.actionsNames.indexOf( actionName ) === -1 ) {
						
						this.actionsNames.push( actionName );
						
					}
				
				}
				
			}
			
		}
		
	}
	
	function get_is_performing_action ( actionsNames ) {
		
		var i, l,
			actionName,
			action,
			acting = false;
		
		actionsNames = typeof actionsNames !== 'undefined' ? main.ensure_array( actionsNames ) : this.actionsNames;
		
		for ( i = 0, l = actionsNames.length; i < l; i++ ) {
			
			actionName = actionsNames[ i ];
			
			action = this.actions[ actionName ];
			
			if ( typeof action.activeCheck === 'function' && action.activeCheck.call( action.activeCheckContext ) === true ) {
				
				acting = true;
				
				break;
				
			}
			
		}
		
		return acting;
		
	}
	
	function stop_action ( actionsNames ) {
		
		var i, l,
			actionName,
			action;
		
		// trigger stop for all actions that are active
		
		actionsNames = typeof actionsNames !== 'undefined' ? main.ensure_array( actionsNames ) : this.actionsNames;
		
		for ( i = 0, l = actionsNames.length; i < l; i++ ) {
			
			actionName = actionsNames[ i ];
			
			action = this.actions[ actionName ];
			
			if ( typeof action.activeCheck === 'function' && action.activeCheck.call( action.activeCheckContext ) === true ) {
				
				this.action( actionName, { stop: true } );
				
			}
				
		}
		
	}
	
	/*===================================================
	
	move
	
	=====================================================*/
	
	function move_state_change ( propertyName, stop ) {
		
		var state = this.movement.state;
		
		// handle state property
		
		if ( state.hasOwnProperty( propertyName ) ) {
			
			state[ propertyName ] = stop === true ? 0 : 1;
			
		}
		
	}
	
	/*===================================================
	
	rotate
	
	=====================================================*/
	
	function rotate_by_delta ( dx, dy, dz, dw ) {
		
		var q = this.quaternion,
			rotate = this.movement.rotate,
			rotateDelta = rotate.delta,
			rotateVec = rotate.vector,
			rotateUtilQ1 = utilQ1Rotate;
		
		rotateDelta.set( dx || 0, dy || 0, dz || 0, dw || 1 ).normalize();
		
		rotateVec.multiplySelf( rotateDelta );
		
		rotateUtilQ1.multiply( q, rotateDelta );
		
		q.copy( rotateUtilQ1 );
		
	}
	
	/*===================================================
	
	morph cycling
	
	=====================================================*/
	
	function morph_cycle ( timeDelta, cycleType, duration, loop, reverse ) {
		
		var morphs = this.morphs,
			movement = this.movement,
			move = movement.move,
			state = movement.state;
		
		if ( state.moveType !== cycleType ) {
			
			if ( move.animationChangeTimeTotal < move.animationChangeTimeThreshold ) {
				
				move.animationChangeTimeTotal += timeDelta;
				
			}
			else {
				
				move.animationChangeTimeTotal = 0;
				
				morphs.clear( state.moveType, move.morphClearTime );
				
				state.moveType = cycleType;
				
			}
			
		}
		
		morphs.play( state.moveType, { duration: duration, loop: loop, reverse: reverse } );
		
	}
	
	/*===================================================
	
	followers
	
	=====================================================*/
	
	function update_followers () {
		
		var i, l,
			followSettings;
		
		/*
		// example follow settings
		followSettings = {
			obj: model,
			rotationBase: new THREE.Quaternion(),
			rotationOffset: new THREE.Vector3( 0, 0, 0 ),
			positionOffset: new THREE.Vector3( 0, 0, 0 )
		};
		*/
		
		for ( i = 0, l = this.followers.length; i < l; i ++ ) {
			
			followSettings = this.followers[ i ];
			
			_ObjectHelper.object_follow_object( followSettings.obj, this, followSettings.positionOffset, followSettings.rotationBase, followSettings.rotationOffset );
				
		}
		
	}
	
	/*===================================================
	
	update
	
	=====================================================*/
	
	function update ( timeDelta, timeDeltaMod ) {
		
		var physics = this.physics,
			rigidBody = physics.rigidBody,
			morphs = this.morphs,
			movement = this.movement,
			move = movement.move,
			rotate = movement.rotate,
			jump = movement.jump,
			state = movement.state,
			rotateDir = rotate.direction,
			rotateDelta = rotate.delta,
			rotateSpeed = rotate.speed * timeDeltaMod,
			moveDir = move.direction,
			moveVec = move.vector,
			moveSpeed = move.speed * timeDeltaMod,
			moveSpeedBack = move.speedBack * timeDeltaMod,
			moveSpeedRatio = Math.min( 1, ( moveSpeedBack / moveSpeed ) * 2 ),
			jumpSpeedStart,
			jumpSpeedEnd,
			jumpTimeTotal,
			jumpTimeMax,
			jumpTimeRatio,
			jumpTimeAfterNotGroundedMax,
			jumpStartDelay,
			velocityGravity,
			velocityGravityForce,
			velocityMovement,
			velocityMovementForce,
			velocityMovementForceLength,
			velocityMovementDamping,
			dragCoefficient,
			terminalVelocity,
			playSpeedModifier;
		
		// update vectors with state
		
		moveDir.x = ( state.left - state.right );
		moveDir.z = ( state.forward - state.back );
		
		rotateDir.y = ( state.turnleft - state.turnright );
		
		// set moving
				
		if ( state.forward === 1 || state.back === 1 || state.turnleft === 1 || state.turnright === 1 || state.up === 1 || state.down === 1 || state.left === 1 || state.right === 1 ) {
			
			state.moving = true;
			
		}
		else {
			
			state.moving = false;
			
		}
		
		// rotate self
		
		this.rotate_by_delta( rotateDir.x * rotateSpeed, rotateDir.y * rotateSpeed, rotateDir.z * rotateSpeed, 1 );
		
		// velocity
		
		if ( typeof rigidBody !== 'undefined' ) {
			
			// properties
			
			velocityMovement = rigidBody.velocityMovement;
			velocityMovementForce = velocityMovement.force;
			velocityGravity = rigidBody.velocityGravity;
			velocityGravityForce = velocityGravity.force;
			
			jumpTimeTotal = jump.timeTotal;
			jumpTimeMax = jump.timeMax;
			jumpTimeAfterNotGroundedMax = jump.timeAfterNotGroundedMax;
			jumpStartDelay = jump.startDelay;
			jumpSpeedStart = jump.speedStart * timeDeltaMod;
			jumpSpeedEnd = jump.speedEnd * timeDeltaMod;
			
			// movement basics
			
			moveVec.copy( moveDir );
			moveVec.x *= moveSpeed;
			moveVec.y *= moveSpeed;
			
			if ( moveDir.z < 0 ) {
				
				moveVec.z *= moveSpeedBack;
				
				jumpSpeedStart *= moveSpeedRatio;
				jumpSpeedEnd *= moveSpeedRatio;
				
			}
			else if ( jump.active === true ) {
				
				moveVec.z *= jumpSpeedStart;
				
			}
			else {
				
				moveVec.z *= moveSpeed;
				
			}
			
			// handle jumping
			
			state.groundedLast = state.grounded;
			
			state.grounded = Boolean( velocityGravity.collision ) && !velocityGravity.moving;
			
			jump.timeAfterNotGrounded += timeDelta;
			
			// if falling but not jumping
			
			if ( jump.active === false && jump.timeAfterNotGrounded >= jumpTimeAfterNotGroundedMax && state.grounded === false ) {
				
				jump.ready = false;
				
				this.morph_cycle( timeDelta, 'jump', jump.animationTime, true );
				
			}
			// do jump
			else if ( state.up !== 0 && ( state.grounded === true || jump.timeAfterNotGrounded < jumpTimeAfterNotGroundedMax ) && jump.ready === true ) {
				
				jump.timeTotal = 0;
				
				jump.startDelayTime = 0;
				
				jump.ready = false;
				
				jump.active = true;
				
			}
			else if ( jump.active === true && jump.timeTotal < jumpTimeMax ) {
				
				// count delay
				
				jump.startDelayTime += timeDelta;
				
				// do jump after delay
				
				if ( jump.startDelayTime >= jump.startDelay ) {
					
					// play jump
				
					this.morph_cycle ( timeDelta, 'jump', jump.animationTime, true );
					
					// properties
					
					jumpTimeRatio = jumpTimeTotal / jumpTimeMax;
					
					// update time total
					
					jump.timeTotal += timeDelta;
					
					// add speed to gravity velocity
					
					velocityGravityForce.y += jumpSpeedStart * ( 1 - jumpTimeRatio) + jumpSpeedEnd * jumpTimeRatio;
					
				}
				else {
					
					// play jump start
					
					morphs.play( 'jump_start', { duration: jump.startAnimationTime, loop: false, callback: function () { morphs.clear( 'jump_start' ); } } );
					
					// hold velocity
					velocityGravityForce.y  = 0;
					
				}
				
			}
			else {
				
				if ( state.grounded === true && jump.active !== false ) {
					
					jump.active = false;
					
					if ( jump.timeAfterNotGrounded >= jumpTimeAfterNotGroundedMax ) {
						
						morphs.clear( 'jump', move.morphClearTime );
					
						morphs.play( 'jump_end', { duration: jump.endAnimationTime, loop: false, callback: function () { morphs.clear( 'jump_end', move.morphClearTime ); } } );
					
					}
					
				}
				
				if ( state.grounded === true && state.up === 0 ) {
					
					jump.timeAfterNotGrounded = 0;
					
					jump.ready = true;
					
				}
				
			}
			
			// add move vec to rigidBody movement
			
			velocityMovementForce.addSelf( moveVec );
			
			// moving backwards?
			
			if ( velocityMovementForce.z < 0 ) {
				
				state.movingBack = true;
				
			}
			else if ( velocityMovementForce.z > 0 ) {
				
				state.movingBack = false;
				
			}
			
			// get movement force
			
			velocityMovementForceLength = velocityMovementForce.length() / timeDeltaMod;
			
			// walk/run/idle
			
			if ( jump.active === false && state.grounded === true ) {
				
				// walk / run cycles
				
				if ( velocityMovementForceLength > 0 ) {
					
					// get approximate terminal velocity based on acceleration (moveVec) and damping
					// helps morphs play faster if character is moving faster, or slower if moving slower
					// TODO: move equation into physics module
					
					velocityMovementDamping = velocityMovement.damping.z;
					dragCoefficient = ( 0.33758 * Math.pow( velocityMovementDamping, 2 ) ) + ( -0.67116 * velocityMovementDamping ) + 0.33419;
					terminalVelocity = Math.round( Math.sqrt( ( 2 * Math.abs( moveVec.z * 0.5 ) ) / dragCoefficient ) );
					playSpeedModifier = terminalVelocity / Math.round( velocityMovementForceLength );
					
					if ( velocityMovementForceLength > move.runThreshold ) {
						
						this.morph_cycle ( timeDelta, 'run', move.runAnimationTime * playSpeedModifier, true, state.movingBack );
						
					}
					else {
						
						this.morph_cycle ( timeDelta, 'walk', move.walkAnimationTime * playSpeedModifier, true, state.movingBack );
						
					}
					
				}
				// idle cycle
				else {
					
					this.morph_cycle ( timeDelta, 'idle', move.idleAnimationTime, true, false );
					
				}
				
			}
			
		}
		
		// update followers
		
		this.update_followers();
		
	}
	
	/*===================================================
	
	show / hide
	
	=====================================================*/
	
	function show ( scene ) {
		
		if ( this.showing === false ) {
			
			this._scene = scene || _Game.scene;
			
			this.scene.add( this );
			
			this.showing = true;
			
		}
		
	}
	
	function hide () {
		
		if ( this.showing === true ) {
			
			this.scene.remove( this );
			
			this.showing = false;
			
		}
		
	}
	
} ( KAIOPUA ) );