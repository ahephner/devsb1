import { LightningElement, api, track, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import cloneHeaders from '@salesforce/apex/cpqProgramClone.cpqProgramCloneStep1';
import cloneProducts from '@salesforce/apex/cpqProgramClone.cloneProducts';
import cloneProductsPriceBook from '@salesforce/apex/cpqProgramClone.cloneProductsWithPriceBooks';
import isOwner from '@salesforce/apex/cpqProgramClone.isOwner';
import FORM_FACTOR from '@salesforce/client/formFactor';
import Id from '@salesforce/user/Id';
import getPriceBooks from '@salesforce/apex/getPriceBooks.getPriceBookIds';
//this returns either a set of price book id's or array of objects of all the avaliable price books for the account in order of priority. Standard is always there
import { priorityPricing} from 'c/helperOMS';
export default class CloneProgram extends NavigationMixin(LightningElement) {
    @api recordId
    loaded = false; 
    formSize; 
    data = [];
    msg; 
    sliderValue;
    userId = Id;
    //for cloning 
    isAccountOwner;
    btnDisabled = true;
    priorityValue; 
    accountId;
    ownerAccId; 
    simpleClone = true; 
    connectedCallback(){
        this.formSize = this.screenSize(FORM_FACTOR); 
            //this.currentOWner(); 
    }
    @wire(isOwner,{recId: '$recordId'})
        wiredUser(res){
            if(res.data){
                let ownerId = res.data[0].Account__r.OwnerId;
                //if user is owner and they want to use their pricebooks on clone get the account id here to go get price books later
                this.ownerAccId = res.data[0].Account__c; 
                this.currentOWner(ownerId);
            }else if(res.error){
                console.error(res.error)
            }
        }

        get priorityOptions(){
            return [
                {label:'Yes', value: 'Yes'},
                {label:'No', value: 'No'}

            ]
        }

         async usePriority(event){
                this.priorityValue = event.detail.value;
                if(this.priorityValue === 'Yes'){
                
                    this.simpleClone = false; 
                    this.pbIds =  await this.getBooks(this.ownerAccId);
                }
                this.btnDisabled = false; 
            }
    //check if the account owner is current user otherwise show add account clone
   async currentOWner(accOwner){
        this.isAccountOwner = this.userId === accOwner ? true: false; 
        this.loaded = true;
    }
    //check screen size to show table on desktop and cards on mobile
    screenSize = (screen) => {
        return screen === 'Large'? true : false
    }

   closeScreen(){
    this.dispatchEvent(new CloseActionScreenEvent()); 
   }

    
   handleAccount(mess){
    this.accountId = mess.detail; 
    this.btnDisabled = false; 
}
    handleClear(){
        this.accountId = '';
        this.btnDisabled = true; 
    }

    async getBooks(acc){
        let priceBooks = await getPriceBooks({accountId: acc});
        let pbInfo = await priorityPricing(priceBooks);
        let ids = [...pbInfo.priceBookIdArray]; 
        return ids
    }

    @track mapIds = [];
    newURL; 
    pbIds;
    async handleClone2(){
        this.loaded = false; 
        this.msg = 'Gathering'
        this.sliderValue = 10;
        try{
           this.sliderValue = 35;
            this.msg = 'Inserting Program, Area and Apps'
            this.data = await cloneHeaders({recId: this.recordId, newAccount: this.isAccountOwner, accountId: this.accountId});
            //set values that came back in a wrapper
            this.newURL = this.data.programId;
            let apps = [...this.data.backApps]; 
            
            if(!this.isAccountOwner){
                this.msg = 'Getting Account Price Books'
                this.sliderValue = 50;
                this.simpleClone = false; 
                this.pbIds = await this.getBooks(this.accountId); 
            }
            
            
            this.sliderValue = 75; 
            this.msg = 'Cloning App Products'
            //list<pricebookentry> getPriceBooks.priorityBestPrice(list<string>priceBookIds, string productId)
            let finalStep = this.isAccountOwner && this.simpleClone ? await cloneProducts({JSONSTRING: JSON.stringify(apps)}) : await cloneProductsPriceBook({JSONSTRING: JSON.stringify(apps),priceBookIds: this.pbIds })
            this.sliderValue = 95; 
            this.msg = 'Finishing up. Redirecting Soon'; 
            if(finalStep === 'success'){
                this.closeScreen(); 
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.newURL,
                        objectApiName: 'Opportunity',
                        actionName: 'view'
                    }
                });
            }
        }catch(err){
            alert(JSON.stringify(err))
        }

    }
}
//TC 11-0-11 .24IMDLA
// @track mapIds = {key:[]};
// async handleClone2(){
//     this.loaded = false; 
//     try{
//         this.data = await cloneHeaders({recId: this.recordId});
        
//         this.data.forEach((x)=>{
//             this.mapIds = 
//                 {...this.mapIds,
//                     prevId: x.Prev_App_Id__c,
//                     newId: x.Prev_App_Id__c
//                 }                
            
//         })