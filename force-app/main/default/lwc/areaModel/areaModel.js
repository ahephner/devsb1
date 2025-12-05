import { api ,wire} from 'lwc';
import LightningModal from 'lightning/modal';
import getAreas from '@salesforce/apex/appProduct.areaModel';
export default class AreaModel extends LightningModal{
    @api recid; 
    loading = true; 
    areas;     

connectedCallback() {
 console.log('running')   
    if(this.recid){
        this.start(); 
    }
}

    start(){
        this.areas = getAreas({recordId: this.recid});
        this.loading = false; 
    }
    cancel(){
        this.close(); 
    }

    handleSave(){
        //this.close();
        console.log(this.recid) 
    }
}

