import mv3d from './mv3d.js';
import { MapCell } from './mapCell.js';
import { sleep, snooze } from './util.js';
import { Vector2 } from './mod_babylon.js';

Object.assign(mv3d,{

    mapLoaded: false,
	clearMap(){
		this.mapLoaded=false;
		// clear materials and textures
		for (const key in this.textureCache){
			this.textureCache[key].dispose();
		}
		for (const key in this.materialCache){
			this.materialCache[key].dispose();
		}
		this.animatedTextures.length=0;
		this.textureCache={};
		this.materialCache={};
		// clear map cells
		for (const key in this.cells){
			this.cells[key].dispose(false,true);
		}
		this.cells={};
		for (const char of this.characters){
			char.dispose(false,true);
		}
		this.characters.length=0;
	},

	loadMap(){
		this.loadMapSettings();
		//this.cameraStick.x=$gamePlayer._realX;
		//this.cameraStick.y=$gamePlayer._realY;
		this.updateBlenders();
		this.updateMap();
		this.createCharacters();
	},

	async updateMap(){
		if(this.mapUpdating){ return; }
		this.mapLoaded=true;
		this.mapUpdating=true;
		// unload Far cells? implement if needed.
		// get range of cells based on render distance
		const bounds = {
			left:Math.floor((this.cameraStick.x-this.RENDER_DIST)/this.CELL_SIZE),
			right:Math.floor((this.cameraStick.x+this.RENDER_DIST)/this.CELL_SIZE),
			top:Math.floor((this.cameraStick.y-this.RENDER_DIST)/this.CELL_SIZE),
			bottom:Math.floor((this.cameraStick.y+this.RENDER_DIST)/this.CELL_SIZE),
		}
		//clamp cell range to map
		if(!$gameMap.isLoopHorizontal()){
			bounds.left=Math.max(0,bounds.left);
			bounds.right=Math.min(bounds.right,Math.floor($gameMap.width()/mv3d.CELL_SIZE));
		}
		if(!$gameMap.isLoopVertical()){
			bounds.top=Math.max(0,bounds.top);
			bounds.bottom=Math.min(bounds.bottom,Math.floor($gameMap.height()/mv3d.CELL_SIZE));
		}
		const cellsToLoad=[];
		for (let ix=bounds.left;ix<=bounds.right;++ix)
		for (let iy=bounds.top;iy<=bounds.bottom;++iy){
			let cx=ix, cy=iy;
			if($gameMap.isLoopHorizontal()){ cx = cx.mod(Math.ceil($gameMap.width()/mv3d.CELL_SIZE)); }
			if($gameMap.isLoopVertical()){ cy = cy.mod(Math.ceil($gameMap.height()/mv3d.CELL_SIZE)); }
			cellsToLoad.push(new Vector2(cx,cy));
		}
		const cameraCellPos = new Vector2(Math.round(this.cameraStick.x/this.CELL_SIZE-0.5),Math.round(this.cameraStick.y/this.CELL_SIZE-0.5));
		cellsToLoad.sort((a,b)=>Vector2.DistanceSquared(a,cameraCellPos)-Vector2.DistanceSquared(b,cameraCellPos));
		for (const cellpos of cellsToLoad){
			let {x:cx,y:cy} = cellpos;
			await this.loadMapCell(cx,cy);
			await snooze();
			if(!this.mapLoaded){ this.mapUpdating=false; return; }
		}
		this.mapUpdating=false;
	},

	async loadMapCell(cx,cy){
		const key = [cx,cy].toString();
		if(key in this.cells){ return; }
		const cell = new MapCell(cx,cy);
		this.cells[key]=cell;
		await cell.load();
	},

});