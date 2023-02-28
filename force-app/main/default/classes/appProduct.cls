public class appProduct {
    //get areas that are already defined; 
 @AuraEnabled(Cacheable=true)
   public static list<areaWrapper> getAreas(ID recordId){
       list<areaWrapper> aw = new list<areaWrapper>();
       for(area__c x:[select id, name from area__c where program__c = :recordId]){
           aw.add(new areaWrapper(x.name, x.id));
       }
      // system.debug('aw ' +aw);
       return aw; 
   }
    
    //this is for the pdf wizard to grab the current applications to allow user to select
    //don't mind areaWrapper name I should have named that class something more generic. areaWrapper will support anything that requires a label value return pair 
 //    @AuraEnabled(Cacheable=true)
   //public static list<areaWrapper> getAppPDF(ID recordId){
     //  list<areaWrapper> appPDf = new list<areaWrapper>();
       //for(application__c x:[select id, name from application__c where Program_ID__c = :recordId]){
         //  appPDF.add(new areaWrapper(x.name, x.id));
      // }
       //system.debug(appPDF);
       //return appPDF; 
   //}
//need to make it that if the searchKey is blank nothing happens
//probally better in js    
  @AuraEnabled 
    public static Product__c[] searchProduct(string searchKey, string cat, string family){
        string searchterm = '%' + searchKey + '%'; 
        string category = cat; 
        string pf = family; 
        system.debug(searchTerm);
        String query = 'Select '
            			+ ' Id, Name, Product_Name__c, Product_Status__c,Average_Cost__c, Product_Family__c, Subcategory__c, '
            			+ ' Size__c, Product_Type__c'
            			+ ' From Product__c Where Include_in_Programs__c =True AND Active__c = True and '; 
            			 
        if(!searchterm.contains('null') && category == 'All' && pf == 'All'){
            query += ' (name like :searchTerm or product_name__c like :searchTerm)';
        }else if (!searchterm.contains('null') && category != 'All' && pf == 'All'){
            query += ' (name like :searchTerm or product_name__c like :searchTerm) and subcategory__c =:category';
        }else if(!searchterm.contains('null') && category == 'All' && pf != 'All'){
            query += ' (name like :searchTerm or product_name__c like :searchTerm) and Product_Family__c =:pf';
        }else if (searchterm.contains('null') && category != 'All' && pf == 'All'){
            query += ' subcategory__c =:category';
        }else if(searchterm.contains('null') && category == 'All' && pf != 'All'){
            query += ' Product_Family__c =:pf';
        }else if(searchterm.contains('null') && category != 'All' && pf != 'All'){
            query += ' Product_Family__c =:pf and subcategory__c =:category'; 
        }else{
           
        }		 	 
        return Database.query(query); 
    } 
    
    @AuraEnabled(Cacheable=true)
    public static list<Application__c> getApps(ID recordId){
      
        list<application__c> apps = [Select Name, Id, Date__c, Area_Name__c, Total_Price_ap__c, Customer_Name__c, Program_Name__c
                                     from Application__c where Program_ID__c =: recordId];
      //  system.debug(apps);
        return apps;
            
    }
    //get area details when adding to the program 
    @AuraEnabled
    public static list<Area__c> areaInfo(string ai){
        list<area__c> a = [select Area_Sq_Feet__c, name, Pref_U_of_M__c from area__c where id =:ai limit 1 ];
        //system.debug(a);
        return a; 
    }
    //update application can't use cacheable or cant edita
    @AuraEnabled
    public static List<App_Product__c> appProducts(string app){
        List<App_Product__c> prods = [Select id, product__c, Product_Name__c,Application__c,Application__r.Name, Application__r.Area__r.Pref_U_of_M__c, 
                                      Application__r.Date__c,Application__r.Note__c, Unit_Area__c, Rate2__c, Area__c, Note__c,Unit_Price__c,Product__r.Agency_Pricing__c,
                                      Total_Price__c, Units_Required__c, Product_Size__c, Application__r.Area__c,Application__r.Total_Price__c,
                                      Application__r.Area__r.Area_Sq_Feet__c,Application__r.Area__r.Area_Acres__c,Margin__c,Product_Cost__c, 
                                      Product_Code__c, Product__r.Product_Type__c,Product__r.N__c, Product__r.K__c, Product__r.P__c, 
                                      Product__r.hasFertilizer__c, product__r.X1_Gallon_Weight__c, Product__r.Floor_Price__c,
                                      N__c, P__c, K__c
                                      from App_Product__c where Application__c =: app];
        
        return prods; 
    }
   //Get pricing for update
   @AuraEnabled
    public static List<PricebookEntry> pricing(list<string> ids){
        
        List<PricebookEntry> prods = [select Product2Id, Product_Cost__c, Level_1_UserView__c,Level_2_UserView__c, 
                                     Floor_Price__c from pricebookentry where Product2Id IN :ids and PriceBook2Id = '01s410000077vSKAAY'];
        system.debug(prods);
        return prods; 
    }
    //Product Search
	@AuraEnabled(cacheable = true) 
    public static PricebookEntry[] searchProduct2(string searchKey, string cat, string family){
      string searchterm = '%' + searchKey + '%'; 
      string category = cat; 
      string pf = family; 
      string pbId = '01s410000077vSKAAY';  
      //will need for full
      //string pClass = 'Simple';
            String query = 'Select Id, Product2Id,'
                + '  Product2.ProductCode, Product2.Name, Product2.Product_Status__c, Product2.Product_Family__c, Product2.Subcategory__c, Product2.Ship_Weight__c, Product2.Pallet_Qty__c,'
                + '  Product2.Floor_Type__c, Product2.Floor_Price__c, Product2.Last_Purchase_Price__c, Agency_Product__c, product2.Total_Product_Items__c, Product2.Temp_Unavailable__c,'
          		+ ' Floor_Price__c, Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c, Product2.Temp_Mess__c, Product_Type__c, Product_Size__c,'
                + ' Product2.N__c, Product2.K__c, Product2.P__c, Product2.hasFertilizer__c, product2.X1_Gallon_Weight__c'
                + ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId  AND' ; 
     //AND Product2.ProductClass =:pClass
      if(!searchterm.contains('null') && category == 'All' && pf == 'All'){
          //system.debug('1');
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)';
         /// system.debug('2');
      }else if (!searchterm.contains('null') && category != 'All' && pf == 'All'){
          //system.debug('3');
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.subcategory__c =:category';
      }else if(!searchterm.contains('null') && category == 'All' && pf != 'All'){
          //system.debug('4');
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.Product_Family__c =:pf';
      }else if(!searchterm.contains('null') && category != 'All' && pf != 'All'){
          //system.debug('5');
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.Product_Family__c =:pf and Product2.subcategory__c =:category';
      }else if (searchterm.contains('null') && category != 'All' && pf == 'All'){
          //system.debug('6');
          query += ' Product2.subcategory__c =:category';
      }else if(searchterm.contains('null')  && category == 'All' && pf != 'All'){
          //system.debug('7');
          query += ' Product2.Product_Family__c =:pf';
      }else if(searchterm.contains('null') && category != 'All' && pf != 'All'){
          //system.debug('8');
          query += ' Product2.Product_Family__c =:pf and Product2.subcategory__c =:category'; 
      }else{
 
      }	
        query += ' order by Product_Status__c  desc nulls last';     	 
       
       list<PricebookEntry> results = Database.query(query);
	    	
      return results;
    }
    	 
}