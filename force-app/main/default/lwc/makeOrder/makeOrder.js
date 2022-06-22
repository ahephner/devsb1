import { LightningElement, api, track } from 'lwc';
const columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Area', fieldName: 'Area_Name__c', sortable: "true" },
    { label: 'Date', fieldName: 'Date__c', sortable: "true"}
]
export default class MakeOrder extends LightningElement {
    @api recordId
    @track data; 
    @api apps;
    @track selection;
    loaded = true; 
    columns = columns; 
    getSelectedApp(e){
        this.selection = e.detail.selectedRows
        console.log(JSON.stringify(this.selection))

    }
    
    getDetails(){
        this.loaded = false
        let toOrder = []; 
        for(let i = 0; i<this.selection.length; i++){
            toOrder.push(this.selection[i].Id);
        }
        return toOrder; 
    }
    async convert(){
        this.loaded = false; 
        let orders = await this.getDetails();
        console.log(orders)    
        }
    connectedCallback(){
        this.data = [...this.apps]
    }
    // @api
    // get apps(){
    //     return this.data; 
    // }
    // set apps(value){
    //     this.data = value; 
    // }
    closeMe(){
        this.dispatchEvent(new CustomEvent('close')); 
    }
     //handle table sorting sorting
 //Grabbed this from a salesforce example
 handleSortdata(event) {
    // field name
    this.sortBy = event.detail.fieldName;

    // sort direction
    this.sortDirection = event.detail.sortDirection;

    // calling sortdata function to sort the data based on direction and selected field
    this.sortData(event.detail.fieldName, event.detail.sortDirection);
}

sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.data));

    // Return the value stored in the field
    let keyValue = (a) => {
        return a[fieldname];
    };

    // cheking reverse direction 
    let isReverse = direction === 'asc' ? 1: -1;

    // sorting data 
    parseData.sort((x, y) => {
        x = keyValue(x) ? keyValue(x) : ''; // handling null values
        y = keyValue(y) ? keyValue(y) : '';

        // sorting values based on direction
        return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.data = parseData;

}
}