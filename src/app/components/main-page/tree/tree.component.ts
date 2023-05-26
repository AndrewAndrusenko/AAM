import {CollectionViewer, SelectionChange, DataSource} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable, ViewChild} from '@angular/core';
import {BehaviorSubject,  merge, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import { TreeMenuSevice } from 'src/app/services/tree-menu.service';
import { MatMenuTrigger as MatMenuTrigger } from '@angular/material/menu';
import { rootNodesColor } from 'src/app/models/constants';
import { routesTreeMenu} from 'src/app/app-routing.module'
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
/** Flat node with expandable and level information */
export class DynamicFlatNode {
  constructor(
    public item: string,
    public level = 1,
    public expandable = false,
    public isLoading = false,
    public nodeRoot: string,
    public favoriteRoot:string, 
    public id : string,
    public color: string
  ) {}
}
@Injectable({providedIn: 'root'})
export class DynamicDatabase {
  constructor (private TreeMenuSevice:TreeMenuSevice, ){}
  public dataMap = new Map;
  public rootLevelNodes = [] ;
  getChildren(node: string): string[] | undefined {return this.dataMap.get(node); }
  isExpandable(node: string): boolean {return this.dataMap.has(node);}
}
export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);
  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }
  constructor(
    private _treeControl: FlatTreeControl<DynamicFlatNode>,
    public _database: DynamicDatabase,
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
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }
  disconnect(collectionViewer: CollectionViewer): void {}
  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach(node => this.toggleNode(node, false));
    }
  }
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) {
      return;
    }

    node.isLoading = true;
    let nodeColor:string;
    setTimeout(() => {
      if (expand) {
        const nodes = children.map(
          name => { 
            let favoriteRoot = '';
            let Root = node.item;
            if (node.item.includes('Favorites')==true) {
              favoriteRoot='Favorites';
              Root = node.item.split('_')[1];
            }
            if (node.item == 'Favorites' ) {
              rootNodesColor.forEach(el=> el.nodes.includes('Favorites')? nodeColor = el.colorChild : null)
              return new DynamicFlatNode(name, node.level + 1, this._database.isExpandable(name), false, node.item, favoriteRoot, name[1],nodeColor )
            } else {
              rootNodesColor.forEach(el=> el.nodes.includes(Root)? nodeColor = el.colorChild : null)
              return new DynamicFlatNode(name[0], node.level + 1, this._database.isExpandable(name), false, Root, favoriteRoot, name[1], nodeColor)
            }
          }
        );
        this.data.splice(index + 1, 0, ...nodes);
      } else {
        let count = 0;
        for (
          let i = index + 1;
          i < this.data.length && this.data[i].level > node.level;
          i++, count++
        ) {}
        this.data.splice(index + 1, count);
      }
      this.dataChange.next(this.data);
      node.isLoading = false;     
    }, 1);    
  }
}
@Component({
  selector: 'app-tree',
  templateUrl: 'tree.component.html',
  styleUrls: ['tree.component.css'],
})
export class TreeComponent {
  routesPathsTreeMenu = routesTreeMenu.map (el=>el.path)
  dataChange: any;
  constructor(
    database: DynamicDatabase, 
    private TreeMenuSevice:TreeMenuSevice, 
    private AuthServiceS:AuthService,  
    private router: Router)  
  {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new DynamicDataSource(this.treeControl, database);
    this.databaseM = database;
    this.initialData();
  }
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  treeControl: FlatTreeControl<DynamicFlatNode>;
  databaseM: DynamicDatabase 
  public dataSource: DynamicDataSource;
  isExpanded : boolean = false;
  public node : DynamicFlatNode;
  public opened : boolean = true;
  public activeNode : DynamicFlatNode;
  public rootLevelNodes: string[];
  rootAccountingNodes = rootNodesColor
  getLevel = (node: DynamicFlatNode) => node.level;
  isExpandable = (node: DynamicFlatNode) => node.expandable;
  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;
  // SendMessage: when node is selected method sends node rootTypeName to the Tab component to show relevant information structure     
  sendMessage = (node: DynamicFlatNode) => {
    let route = node.item.toLowerCase();
    this.routesPathsTreeMenu.includes(node.item)? this.router.navigate(['tree/'+node.item]) : null;
    this.TreeMenuSevice.sendUpdate(node.nodeRoot, node.item, +node.id)
  }
  async initialData() {
    let nodeColor:string
    let userData = JSON.parse(localStorage.getItem('userInfo'));
    this.rootLevelNodes = this.AuthServiceS.accessRestrictions.filter(el =>el.elementid==='rootLevelNodes')[0].elementvalue.split('_');
    this.dataSource.data =  this.rootLevelNodes.map(name => {
      rootNodesColor.forEach(el=> el.nodes.includes(name)? nodeColor = el.color : null);
      return new DynamicFlatNode(name, 0, true, false, name + '_Root','','', nodeColor);
    });
    this.TreeMenuSevice.getTreeData( userData.user.id,  this.rootLevelNodes).subscribe (treeData =>this.databaseM.dataMap = new Map (treeData.map (object  => [object[0], object[1]])));
  }
  ToggleTree = () => {
    if (this.isExpanded) {
      this.treeControl.dataNodes.forEach ( (node, index) => { 
        if (node.level === 0) {setTimeout(() => {this.treeControl.expand(node)}, index*20 ); } 
      })
      } else 
      {this.treeControl.dataNodes.forEach ( (node, index) => { 
        if (node.level === 0) {setTimeout(() => {this.treeControl.collapse(node)}, index*20 ); } 
      })
      }
  }
  // Method to search the Tree Menu element for the item inputed in Search field. 
  searchByTree = (SearchText:string) => {
    SearchText = SearchText.toUpperCase();
    console.log('SearchText',SearchText)
    var parentName : string;
    var isFinded : boolean = false;
    var parentIndex: number;
    //Searching through DataSourse map of Tree component to get parent node name. Then notify if it's not found
    // or expand parent node for further search of given element
    this.databaseM.dataMap.forEach( (node, key) => {
      if (node.flat().find(element => element.toString().toUpperCase().includes(SearchText) && key.split('_')[0] !=='Favorites')) {
        parentName = key;
        isFinded = true;
      }
    });
    !isFinded ? alert ("Element isn't found") : null;
    // Looping through nodes to find parent node which should be expanded
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (this.treeControl.dataNodes[i].item == parentName) {
        this.treeControl.expand(this.treeControl.dataNodes[i])
        parentIndex = i; 
      }
    }
    // Continue to loop through nodes to find given child item. Then emulate a click on the item to get relevant tab component
    // and acivate node to make it highleted. Timeout is needed to give treeControl.dataNodes time to append childnodes of expanded 
    // parent node. 
    setTimeout(() => {
      for (let i = parentIndex; i < this.treeControl.dataNodes.length; i++) {
        if (this.treeControl.dataNodes[i].item.toUpperCase().includes (SearchText)) {
          this.sendMessage(this.treeControl.dataNodes[i]);
          this.activeNode=this.treeControl.dataNodes[i];        
        }
      }
      // Scroll into view founded item
      setTimeout(() => {
        const classElement = document.getElementsByClassName('background-highlight');
        if(classElement.length > 0) {classElement[0].scrollIntoView(); }
      }, 50); 
    }, 100); 
  }
  // ------------------------SearchByTreeComponent-----------------------------------
  handleNewFavoriteClick(target){
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    this.TreeMenuSevice.addItemToFavorites (this.activeNode.item , this.activeNode.nodeRoot, userData.user.id, this.activeNode.id)
    .then((response) => { console.log('Added to Favorites')})
    this.handleAddFavUpdate()
  }
  handleDeleteFavoriteClick(){
    let userData = JSON.parse(localStorage.getItem('userInfo'))
    this.TreeMenuSevice.removeItemFromFavorites (this.activeNode.item , userData.user.id, this.activeNode.id)
    .then((response) => {console.log('Deleted from Favorites')})
    this.handleDeleteFavUpdate (this.activeNode.nodeRoot)
  }
  handleDeleteFavUpdate (Root) {
    let favarr = this.dataSource._database.dataMap.get('Favorites'+'_'+ Root)
    let ind = favarr.findIndex( element => element.includes(this.activeNode.item))
    favarr.splice(ind,1)
    this.dataSource._database.dataMap.set('Favorites'+'_' + Root, favarr)
    let favnode = this.treeControl.dataNodes.find(node=>node.item == 'Favorites') 
    setTimeout(() => {
      this.treeControl.collapse (favnode)
    }, 10); 
    setTimeout(() => {
    this.treeControl.expand (favnode)
    }, 20);  
  }
  public handleAddFavUpdate () {
    let favarr = this.dataSource._database.dataMap.get('Favorites'+'_'+this.activeNode.nodeRoot)
    favarr.push([this.activeNode.item, this.activeNode.id])
    this.dataSource._database.dataMap.set('Favorites' + '_' + this.activeNode.nodeRoot, favarr)
  }
}