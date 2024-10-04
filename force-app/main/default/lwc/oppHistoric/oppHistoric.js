import { LightningElement, api } from 'lwc';
import history from '@salesforce/apex/appProduct.history';
import getPickListValues from '@salesforce/apex/lwcHelper.getPickListValues';
const columnsList = [
    {type: 'button', 
     initialWidth: 75,typeAttributes:{
        label: {fieldName:'rowLabel'},
        name: 'Add',
        title: 'Add',
        disabled: false,
        value: {fieldName: 'rowValue'},
        variant: {fieldName:'rowVariant'}
    }, 
    cellAttributes: {
        style: 'transform: scale(0.75)'}
    },
    {label: 'Name', fieldName:'Name', cellAttributes:{alignment:'left'}, "initialWidth": 375},
    {label: 'Code', fieldName:'Code', cellAttributes:{alignment:'center'}, "initialWidth": 134},
    {label: 'Status', fieldName:'Product_Status__c', cellAttributes:{alignment:'center'}, "initialWidth": 78},
    {label: 'Amount Quoted', fieldName:'prevCharge', 
    type:'currency', cellAttributes:{alignment:'center'}, "initialWidth": 120},
    {label: 'Close Date', fieldName:'closeDate', cellAttributes:{alignment:'center'}, "initialWidth": 120},
    {label: 'Order Status', fieldName:'stage', cellAttributes:{alignment:'center'}, "initialWidth": 120}
]
export default class OppHistoric extends LightningElement{
    showHistory = false;
    @api date;
    @api acc;
    nothingFound = false;
    mess= '' 
    helpMessage = `This data shows products that were quoted for this account 11 and 13 months from this potential application date. Use it to review past purchasing trends and see what your account was considering during that time.`
    prod=[]
    preFilter = []
    loaded=false; 
    options = []; 
    columnsList = columnsList; 
    connectedCallback(){
        this.getHistory();
    }

    async getHistory(){
        if(this.date && this.acc){
            let getFilters = await getPickListValues({objName:'Product2', fieldAPI:'Subcategory__c'})
            this.options = await getFilters.map(item=>({
                ...item,
                label: item.label,
                value: item.value
}))
            let data = await history({appdate: this.date,custId:this.acc})
            this.prod = await data.map((item, index) => ({
                rowLabel: 'Add',
                rowValue: 'Add',
                rowVariant: 'success',
                closeDate: item.Opportunity.CloseDate,
                stage: item.Opportunity.StageName,
                oppName: item.Opportunity.Name,
                Name: item.Product2.Name,
                Code: item.ProductCode,
                Product_Status__c: item.Product2.Product_Status__c,
                prevCharge: item.CPQ_Unit_Price__c,
                Id: item.Product2Id,
                Product2Id: item.Product2Id,
                Product_Type__c: item.Product2.Product_Type__c,
                Floor_Price__c: item.Product2.Floor_Price__c,
                //Level_2_Margin__c: item.Level_2_Margin__c,
                Agency_Product__c: item.Product2.Agency_Pricing__c,
                Product_Cost__c: item.Product2.Product_Cost__c,
                Product_Size__c: item.Product2.Size__c,
                nVal: item.Product2.N__c,
                pVal: item.Product2.P__c,
                kVal: item.Product2.K__c,
                sub: item.Product2.Subcategory__c,
                isFert: item.Product2.hasFertilizer__c,
                galWeight: item.Product2.X1_Gallon_Weight__c,
                Product_SDS_Label__c: item.Product2.Website_Label__c
            }));
            this.loaded=true;
            this.preFilter = [...this.prod] 
        }else{
            this.nothingFound = true;
            this.mess = 'error trying to load'; 
        }    

    }
    selectChange(x){
        let filter = x.target.value
        let newCopy = [...this.preFilter]
        if(filter==='All'){
            this.prod = [...newCopy]; 
        }else{
            this.prod = [...newCopy.filter(x=>x.sub ===filter)]
        }
    }

    async handleRowAction(e){ 
       
                const rowAction = e.detail.action.name; 
                const rowName = e.detail.row.Name;
                const rowId = e.detail.row.Id;
                const rowProduct = e.detail.row.Product2Id; 
                const rowProdType = e.detail.row.Product_Type__c;
                const rowLev2 = e.detail.row.Level_2_UserView__c;
                const rowLev1 = e.detail.row.Level_1_UserView__c; 
                const rowFlrPrice = e.detail.row.Floor_Price__c; 
                const rowMargin = e.detail.row.Level_2_Margin__c;
                const rowAgency = e.detail.row.Agency_Product__c;
                const rowCost = e.detail.row.Product_Cost__c;
                const rowSize = e.detail.row.Product_Size__c; 
                const rowN = e.detail.row.nVal;
                const rowP = e.detail.row.pVal;
                const rowK = e.detail.row.kVal; 
                const fert = e.detail.row.isFert; 
                const galWeight = e.detail.row.galWeight;
                const ProductCode = e.detail.row.Code; 
                const rowWebSiteURL = e.detail.row.Product_SDS_Label__c
                
                if(rowAction ==='Add'){
                    let index = this.prod.findIndex(x => x.Id === rowId)
                    this.prod[index].rowLabel = 'X';
                    this.prod[index].rowAction = 'remove';
                    this.prod[index].rowVariant = 'destructive'
                    
                    this.dispatchEvent(new CustomEvent('hisproduct', { 
                    detail:{
                            Id: rowId,
                            Name: rowName,
                            Product__c: rowProduct,
                            ProductCode: ProductCode, 
                            Product_Type__c: rowProdType,
                            // UnitPrice: priceInfo[0].UnitPrice,
                            // alt_PBE_Id: priceInfo[0].Id,
                            // alt_PB_Name: priceInfo[0].Pricebook2.Name,
                            // alt_PB_Id: priceInfo[0].Pricebook2Id,
                            
                            floorPrice: rowFlrPrice,
                            
                            unitCost: rowCost,
                            
                            agency: rowAgency,
                            nVal: rowN,
                            pVal: rowP,
                            kVal: rowK,
                            Product_Size__c: rowSize,
                            isFert: fert,
                            galWeight: galWeight,
                            goodPrice: true,
                            labelURL: rowWebSiteURL
                        }
                    }));
                    this.prod = [...this.prod]
            }else if(rowAction==='remove'){
                console.log('remove');
                
            }
    }

    handleToSearch(){
        this.dispatchEvent(new CustomEvent('close')); 
    }

    
}