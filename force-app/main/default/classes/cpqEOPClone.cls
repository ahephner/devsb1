public class cpqEOPClone {
    private ApexPages.StandardController controller {get; set;}
       
       private Opportunity opp {get; set;}
       //private Product2 prods {get; set;}
       //set the id of the record that is created --Only used by Test Class
       public ID newOppID {get; set;}
       private string nonActiveItem = '';
       //hard coded for now. Go to workbench run SELECT Id,Name FROM Pricebook2 copy the id of the book needed. 
       private string sportsPriceBookId = '01s17000003ccClAAI';  
       //start the controller
       public cpqEOPClone(ApexPages.StandardController controller){
           
           this.controller = controller;
           //grab this record
           opp = (Opportunity)controller.getRecord();
           system.debug('opp Id' + opp);
       }
       
       public PageReference cloneEOP(){
           Opportunity x = opp;
           Savepoint sp = Database.setSavepoint();
           Opportunity newOp;
           Date cd = System.today();
           
          // pricebook2 pbID = [select id from Pricebook2 where name = 'Standard Price Book' ];
           try{
                       
            x = [SELECT Id, Name, AccountId, CloseDate, Warehouse__c, StageName,  Sales_Rep__r.OwnerId, Pay_Type__c, Ship_Type__c, account.name,
                   Shipping_Address__c, RecordType.Id, Contact__c, pricebook2.id,Type, Order_Comments__c FROM Opportunity where id = :opp.Id];
               system.debug('picked up '+x);
               newOp = x.clone(false);
               newOp.RecordTypeId = '01275000000CgcYAAS';
               newOp.Name += ' Cloned';
               newOp.StageName = 'Working(25%)';
               newOp.CloseDate = cd;
              newOp.Pricebook2Id = '01s410000077vSKAAY'; 
               insert newOp; 
               
              //test new data
               newOppID = newOp.Id;
               
                
               list<Opportunitylineitem> items = eopCloneHelper(opp.Id, '01s410000077vSKAAY', newOp.Id);
               
               if(items.size()>0){
                  insert items; 
               }
           }catch(exception e){
               system.debug(e);
               Database.rollback(sp);
               ApexPages.addMessages(e);
               return null; 
           }
           //return null;
           return new PageReference('/lightning/r/Opportunity/'+newOp.id+'/view');
       }
       
       //helper method to convert from ats opp product to opp product
       public static list<OpportunityLineItem> eopCloneHelper(id OppId, id pbId, id newOppId){
           Map<String, Opportunity_Product__c> originalProducts = new Map<String,Opportunity_Product__c>(); 
           Map<String, pricebookentry> priceBookEntries = new Map<String, pricebookentry>(); 
           List<opportunitylineitem> newLines = new List<opportunitylineitem>();
           //Rollback point
           Savepoint sp = Database.setSavepoint();
           system.debug(oppId);
           try{
           //Get the older product codes
           List<Opportunity_Product__c> eopProducts = [select id, Product_Code__c, Order_Qty__c,Unit_Price__c,Line_Comment__c, 
                                                       Margin__c from Opportunity_Product__c where Opportunity__c =: OppId];
               
               for(Opportunity_Product__c a:eopProducts){
                   originalProducts.put(a.Product_Code__c, a);
               }
           //get price book entries based on unique product code     
           list<pricebookentry> pbe = [Select id, ProductCode, product2Id, Floor_Price__c,Product_Cost__c,Agency_Product__c, Pricebook2Id
                                       from pricebookentry where pricebook2id =: pbId and ProductCode in: originalProducts.keySet() and product2.IsActive = true and IsActive = true];
               
               for(pricebookentry y: pbe){
                   priceBookEntries.put(y.ProductCode, y);
               }
               for(pricebookentry y: pbe){
                   if(y.Agency_Product__c == True){
                       newLines.add(new OpportunityLineItem(
                           PricebookEntryId =priceBookEntries.get(y.ProductCode).Id,
                           product2id = y.product2Id,
                           quantity = originalProducts.get(y.ProductCode).Order_Qty__c,
                           unitprice = y.Floor_Price__c,
                           CPQ_Unit_Price__c = y.Floor_Price__c,
                           Cost__c = y.Product_Cost__c,
                           description = originalProducts.get(y.ProductCode).Line_Comment__c,
                           OpportunityId = newOppId
                           
                       ));
                   }else{
                      decimal salesCal;
                       if(originalProducts.get(y.ProductCode).Margin__c == 100){
                           salesCal = (y.Product_Cost__c / 1);
                       } else{
                           salesCal = (y.Product_Cost__c /(1 - (originalProducts.get(y.ProductCode).Margin__c/100)));
                       }
                       //round off the sales margin
                          decimal salesPrice = salesCal.setScale(2, RoundingMode.HALF_UP); 
                       
                       newLines.add(new OpportunityLineItem(
                           PricebookEntryId = priceBookEntries.get(y.ProductCode).Id,
                           product2id = y.product2Id,
                           quantity = originalProducts.get(y.ProductCode).Order_Qty__c,
                           unitprice = salesPrice,
                           CPQ_Unit_Price__c = salesPrice,
                           Cost__c = y.Product_Cost__c,
                           CPQ_Margin__c = originalProducts.get(y.ProductCode).Margin__c,
                           description = originalProducts.get(y.ProductCode).Line_Comment__c,
                           OpportunityId = newOppId
                       ));
                   }  
                  
               }
           }catch(exception e){
               Database.rollback(sp);
               ApexPages.addMessages(e); 
               return null;
           }
           
           return newLines; 
       }
   }