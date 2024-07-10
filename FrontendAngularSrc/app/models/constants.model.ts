
const accountingNodeColor = 'rgb(27, 112, 125)'
const accountingNodeColorChild = 'rgb(27, 112, 125)'
export const investmentNodeColor = 'rgb(22, 68, 128)'
export const investmentNodeColorChild = 'rgb(22, 68, 128)'
export const additionalLightGreen = 'rgb(53, 168, 110)'
 
export const menuColorGl = 'rgb(22, 68, 128)'

export const rootNodesColor = [
  {
    nodes:['Accounting', 'Non-Trade Operations'],  
    color:accountingNodeColor, 
    colorChild:accountingNodeColorChild
  },
  {
    nodes:['Portfolios','Clients','Strategies','Instruments','Trades & Orders'],  
    color:investmentNodeColor,
    colorChild:investmentNodeColorChild
  },
  {
    nodes:['Favorites'],  
    color:investmentNodeColor,
    colorChild:investmentNodeColorChild
  }
]
