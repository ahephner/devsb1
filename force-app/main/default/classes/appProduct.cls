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
       system.debug(query);	 
      return Database.query(query); 
  } 
  
  @AuraEnabled(Cacheable=true)
  public static list<Application__c> getApps(ID recordId){
    
      list<application__c> apps = [Select Name, Id, Date__c, Area_Name__c from Application__c where Program_ID__c =: recordId];
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
  public static List<Application_Product__c> appProducts(string app){
      system.debug('id passed in '+app);
      List<Application_Product__c> prods = [select id, product__c, Product_Name__c,Application__c, Application__r.Name,
                                            Application__r.Date__c, Unit_Area__c, Rate2__c, area__c, Note__c, Unit_Price__c,
                                            Total_Price__c, Units_Required__c,Product_Size__c, Application__r.Area__c,Application__r.Total_Price__c,
                                            Application__r.Area__r.Area_Sq_Feet__c, Margin__c, Product_Cost__c from application_product__c where application__c =: app];
      //system.debug('here are the products ' +prods);
      return prods; 
  }
}