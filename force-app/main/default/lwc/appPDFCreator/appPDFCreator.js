import { LightningElement, wire, api } from 'lwc';
import savePDF_File from '@salesforce/apex/AttachPDFController2.savePDF_File';
import getAreas from '@salesforce/apex/appProduct.getAreas';
export default class AppPDFCreator extends LightningElement {
    @api recordId; 
    areaSelect; 
    @wire(getAreas,{recordId: '$recordId'})
        areaList

    get areaOptions(){
        return this.areaList.data; 
    }

    handleChange(e){
        this.areaSelect = e.detail.value;
        console.log('area '+this.areaSelect);
        console.log('record '+ this.recordId);
        
                 
    }

    createPDF(){
        savePDF_File({Id: this.areaSelect, appId: this.recordId})
        .then(()=>{
            console.log('pdf created?');
            
        })
    }
}