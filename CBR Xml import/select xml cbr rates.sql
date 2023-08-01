
SELECT  
unnest (xpath('//Valute/Value/text()', x)) AS Value,
unnest (xpath('//Valute/NumCode/text()', x)) AS NumCode,  
unnest (xpath('//Valute/Nominal/text()', x)) AS Nominal , 
unnest (xpath('//Valute/CharCode/text()', x)) AS CharCode 


FROM unnest(xpath('//ValCurs',XMLPARSE(DOCUMENT convert_from(pg_read_binary_file('c:/JS/XML_daily.asp.xml'), 'UTF8'))    )) x 