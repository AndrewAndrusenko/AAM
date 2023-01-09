import {CollectionViewer, SelectionChange, DataSource} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import { NgSwitch, UpperCasePipe } from '@angular/common';
import {Component, Injectable, Input, OnChanges, SimpleChanges} from '@angular/core';
import {BehaviorSubject, merge, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import { CommonService } from 'src/app/services/mtree.service';
import { AppMenuComponent } from '../app-menu/app-menu.component';
import { TreeMenuSevice } from "src/app/services/tree-menu.service"
/** Flat node with expandable and level information */
export class DynamicFlatNode {
  constructor(
    
    public item: string,
    public level = 1,
    public expandable = false,
    public isLoading = false,
    public nodeRoot: string
  ) {}
}

/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
@Injectable({providedIn: 'root'})
export class DynamicDatabase {
  constructor (private TreeMenuSevice:TreeMenuSevice){}
  public dataMap = new Map;
  rootLevelNodes: string[] = ['Favourites','Clients','Accounts', 'Strategies','Instruments','Trades & Orders'];

  /** Initial data from database */
  initialData(): DynamicFlatNode[] {
  this.TreeMenuSevice.getTreeData().subscribe (treeData =>{
    this.dataMap = new Map (treeData.map(object => {return [object[0], object[1]]}))
    //console.log('SQL dataMap')
    //console.table(this.dataMap)
    ;
   })   
    return this.rootLevelNodes.map(name => new DynamicFlatNode(name, 0, true, false, ''));
  }

  getChildren(node: string): string[] | undefined {
    return this.dataMap.get(node);
  }

  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }
}
/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    console.log('set',value)
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
    //console.log (value)

  }

  constructor(
    private _treeControl: FlatTreeControl<DynamicFlatNode>,
    private _database: DynamicDatabase,
  ) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this._treeControl.expansionModel.changed.subscribe(change => {
      if (
        (change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });
  //  console.log (this.data)
   // console.log (this.dataChange)

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    //console.log('handleTreeControl')
    console.log (change)
    if (change.added) {
      console.log('change.added')
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach(node => this.toggleNode(node, false));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) {
      // If no children, or cannot find the node, no op
      return;
    }

    node.isLoading = true;

    setTimeout(() => {
      if (expand) {
        const nodes = children.map(
          name => new DynamicFlatNode(name, node.level + 1, this._database.isExpandable(name), false, node.item ),
        );

        this.data.splice(index + 1, 0, ...nodes);
      //console.table(nodes)

      } else {
        let count = 0;
        for (
          let i = index + 1;
          i < this.data.length && this.data[i].level > node.level;
          i++, count++
        ) {}
        this.data.splice(index + 1, count);
      }

      // notify the change
      this.dataChange.next(this.data);
      node.isLoading = false;
      //console.log('data')
      //console.table(this.data)
    }, 1);
    

    //console.table(this._treeControl.dataNodes)

  }
}

/**
 * @title Tree with dynamic data
 */
@Component({
  selector: 'app-tree',
  templateUrl: 'tree.component.html',
  styleUrls: ['tree.component.css'],
})
export class TreeComponent {
  dataChange: any;
  constructor(database: DynamicDatabase, private Service: CommonService)  {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, database);
    this.databaseM = database
    this.dataSource.data = database.initialData();
   // console.log('initialData');
    //console.table (this.databaseM)
  }
  
  
  treeControl: FlatTreeControl<DynamicFlatNode>;
  databaseM: DynamicDatabase 
  dataSource: DynamicDataSource;
  public node : DynamicFlatNode;
  isclicked : boolean;
  public activeNode : DynamicFlatNode;
  
  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;
    
  sendMessage = (node: DynamicFlatNode) => {
 // console.log ('Send Click');
 //  console.table(this.databaseM.dataMap);
 
    this.Service.sendUpdate(node.nodeRoot.toString())}
   
  searchByTree = (SearchText:string) => {
    SearchText = SearchText.toUpperCase();
    var parentName : string;
    var isFinded : boolean = false;
    
    this.databaseM.dataMap.forEach( (node, key) => {
      if (node.find(element => element.toUpperCase().includes(SearchText))) {
        parentName = key;
        isFinded = true;
        console.log (key);}
    });
    console.log(isFinded)
    !isFinded ? alert ("Element isn't found") :{}

    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (this.treeControl.dataNodes[i].item == parentName) {this.treeControl.expand(this.treeControl.dataNodes[i])}
    }
    setTimeout(() => {
      for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (this.treeControl.dataNodes[i].item.toUpperCase() == SearchText) {
        this.sendMessage(this.treeControl.dataNodes[i]);
        this.activeNode=this.treeControl.dataNodes[i]; 
      }
    }
     console.log(this.treeControl.dataNodes.length)      
    }, 200); 

  }
}


//this.treeControl.isExpanded (parentNode)

// public item: string,
// public level = 1,
// public expandable = false,
// public isLoading = false,
// public nodeRoot: string