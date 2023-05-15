import { LightningElement, api } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import cloneHeaders from '@salesforce/apex/cpqProgramClone.cpqProgramCloneStep1';
import cloneProducts from '@salesforce/apex/cpqProgramClone.cloneProducts';
import FORM_FACTOR from '@salesforce/client/formFactor';
export default class CloneProgram extends LightningElement {
    @api recordId
    loaded = false; 
    formSize; 
    data = [];

    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR); 
        this.loaded = true; 
    }

    //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
    }

   
    handleClone(){
        this.loaded = false; 
        cloneHeaders({recId: this.recordId})
            .then((res)=>{
                this.data = res; 
                console.log(this.data)
                this.loaded = true; 
            }).then(()=>{
                let mapId = new Map();
                this.data.forEach((x)=>{
                    mapId.set(x.Prev_App_Id__c, x.Id);
                    cloneProducts({preId: mapId})
                        .then((res2)=>{
                            console.log(res2);
                            this.loaded = true; 
                        })
                })

            })
    }
}


