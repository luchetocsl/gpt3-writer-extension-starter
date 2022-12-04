const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};


const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
  try {

    sendMessage('generating...');

    const { selectionText } = info;
    const basePromptPrefix = 
    `
    Write a good prompt for an IA-generated image based on what is written below. . It should follow this formula: ${info.selectionText}. Art Medium. Art Style. By Artist. 4k. UHD.  Extra details. If there is something missing to the formula, fill in the blanks. 
    `
  ;
    const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

    // Let's see what we get!
    console.log(selectionText + baseCompletion.text)

    sendMessage(selectionText + baseCompletion.text);
    
  } catch (error) {
    console.log(error);

    // Add this here as well to see if we run into any errors!
    sendMessage(error.toString());
  }
}



chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate GPT-3 Prompt',
    contexts: ['selection'],
  });
});


// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);