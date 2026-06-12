import fetch from "node-fetch";

const commonTopics = {
  "binary search": {
    English: {
      explanation: `# Binary Search

### Definition & Introduction
Binary Search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one.

### Prerequisites
- The collection must be **sorted** in ascending or descending order.
- Elements must be accessible in constant time (like an array).

### How It Works (Working Principle)
1. Compare the target value to the middle element of the array.
2. If the target value is equal to the middle element, its position is returned.
3. If the target value is less than the middle element, search continues on the lower half.
4. If the target value is greater than the middle element, search continues on the upper half.
5. Repeat the process until the element is found or the subarray size becomes zero.

### Step-by-Step Example
Let's search for **7** in the sorted array: \`[1, 3, 5, 7, 9, 11, 13, 15]\`
- **Initial State**: Low = 0, High = 7.
- **Step 1**: Mid = (0 + 7) / 2 = 3. Array[3] is **7**. Match found!

### Complexity
- **Time Complexity**: 
  - Best Case: O(1) (target is middle element)
  - Average/Worst Case: O(log N) (logarithmic time)
- **Space Complexity**: O(1) (constant space for iterative version)

### Use Cases & Applications
- Searching in large databases.
- Finding roots of equations.
- Debugging (git bisect to find bug-introducing commits).

### Advantages & Disadvantages
- **Advantages**: Incredibly fast compared to linear search (O(N)) for large datasets.
- **Disadvantages**: Requires the array to be sorted beforehand. Dynamic insertions/deletions are expensive as sorting must be maintained.`,
      video_script: `Welcome! Today we will learn about Binary Search, one of the most efficient searching algorithms. [pause] First, let's define it. Binary Search finds the position of a target value within a sorted array. [pause] The key prerequisite is that the array must be sorted. [pause] How does it work? It compares the target with the middle element. If they match, we are done. If the target is smaller, we search the left half. If larger, we search the right half. [pause] By cutting the search space in half each step, it achieves a logarithmic time complexity of O of log N. [pause] This makes it incredibly fast for large datasets.`,
      slides: [
        {
          title: "Introduction to Binary Search",
          points: ["An efficient search algorithm", "Finds target in a sorted array", "Works on the divide-and-conquer principle"]
        },
        {
          title: "Prerequisites & Complexity",
          points: ["Prerequisite: Array must be sorted", "Time Complexity: O(log N) - Logarithmic", "Space Complexity: O(1) - Constant space"]
        },
        {
          title: "Step-by-Step Process",
          points: ["Compare target with the middle element", "If target is smaller, eliminate right half", "If target is larger, eliminate left half", "Repeat until found or search space is empty"]
        },
        {
          title: "Pros & Cons",
          points: ["Pro: Incredibly fast for large datasets", "Con: Sorting the array beforehand is mandatory", "Con: Only works with random-access structures like arrays"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Prerequisites & Complexity",
        "Step-by-Step Process",
        "Summary & Trade-offs"
      ],
      visual_suggestions: [
        "A sorted array showing low, mid, and high pointers",
        "Flowchart comparing Linear Search vs Binary Search",
        "Diagram showing array size dividing by 2 at each step"
      ]
    },
    Hinglish: {
      explanation: `# Binary Search

### Definition & Introduction
Binary Search ek efficient algorithm hai jo sorted list mein se kisi element ko search karne ke kaam aata hai. Yeh divide and conquer technique par kaam karta hai, jisme list ko baar-baar half (aadha) kar diya jata hai jab tak target element mil na jaye.

### Prerequisites
- Array/List hamesha **sorted** honi chahiye (ascending ya descending).
- Elements ko directly access kiya ja sake (jaise arrays mein).

### Working Principle
1. Target value ko array ke middle element se compare karein.
2. Agar target middle element se match karta hai, toh position return karein.
3. Agar target chota hai, toh left half mein search karein.
4. Agar target bada hai, toh right half mein search karein.
5. Yeh process tab tak repeat karein jab tak element na mil jaye ya search space khali na ho jaye.

### Time & Space Complexity
- **Time Complexity**: O(log N) - Jo linear search (O(N)) se bohot fast hai.
- **Space Complexity**: O(1) - Iterative version ke liye constant space.

### Advantages & Disadvantages
- **Advantages**: Large datasets ke liye bohot fast hai.
- **Disadvantages**: Array ka sorted hona compulsory hai.`,
      video_script: `Aaj hum Binary Search ke baare mein samjhenge. [pause] Binary search ek sorted array mein se element dhundhne ka sabse fast tareeka hai. [pause] Iska rule hai ki array pehle se sorted hona chahiye. [pause] Yeh array ke middle element ko check karta hai. Agar match mil gaya toh badhiya, nahi toh search space ko half kar deta hai. [pause] Iski speed O of log N hoti hai, jo ise bade data ke liye best banati hai.`,
      slides: [
        {
          title: "Binary Search Kya Hai?",
          points: ["Sorted list se element search karne ka efficient tareeka", "Divide and conquer principle par works", "List ko check karke half space discard kar deta hai"]
        },
        {
          title: "Prerequisites aur Complexity",
          points: ["Prerequisite: Array sorted hona compulsory hai", "Time Complexity: O(log N) - Bahut fast", "Space Complexity: O(1) - Low memory"]
        },
        {
          title: "Step-by-Step Kaam Kaise Karta Hai",
          points: ["Target ko middle element se compare karein", "Chota ho toh left half mein jayein", "Bada ho toh right half mein jayein", "Repeat until found"]
        },
        {
          title: "Advantages aur Disadvantages",
          points: ["Pro: Large datasets ke liye super fast", "Con: Pehle sorting ki zarurat padti hai", "Con: Linked list par implement karna thoda hard hota hai"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Prerequisites & Complexity",
        "Step-by-Step Process",
        "Summary & Trade-offs"
      ],
      visual_suggestions: [
        "A sorted array showing low, mid, and high pointers",
        "Flowchart comparing Linear Search vs Binary Search",
        "Diagram showing array size dividing by 2 at each step"
      ]
    },
    Hindi: {
      explanation: `# बाइनरी सर्च (Binary Search)

### परिभाषा और परिचय
बाइनरी सर्च एक कुशल सर्चिंग एल्गोरिदम है जिसका उपयोग सॉर्टेड (Sorted) एरे में किसी तत्व को खोजने के लिए किया जाता है। यह सूची को बार-बार आधा करके काम करता है जब तक कि वांछित तत्व न मिल जाए।

### आवश्यक शर्तें (Prerequisites)
- सूची हमेशा **सॉर्टेड** (क्रमबद्ध) होनी चाहिए।
- तत्वों को सीधे एक्सेस करने की क्षमता होनी चाहिए (जैसे एरे)।

### कार्य प्रणाली (Working Principle)
1. लक्ष्य मान (Target) की तुलना एरे के मध्य तत्व से करें।
2. यदि वे बराबर हैं, तो स्थिति लौटाएं।
3. यदि लक्ष्य छोटा है, तो बाएं हिस्से में खोजें।
4. यदि लक्ष्य बड़ा है, तो दाएं हिस्से में खोजें।
5. यह प्रक्रिया तब तक दोहराएं जब तक तत्व न मिल जाए।

### जटिलता (Complexity)
- **समय जटिलता (Time Complexity)**: O(log N) - बहुत तेज़।
- **स्थान जटिलता (Space Complexity)**: O(1) - न्यूनतम मेमोरी उपयोग।

### लाभ और हानि
- **लाभ**: बड़े डेटा सेट के लिए बहुत तेज़ है।
- **हानि**: डेटा का पहले से सॉर्टेड होना अनिवार्य है।`,
      video_script: `नमस्कार! आज हम बाइनरी सर्च के बारे में सीखेंगे। [pause] यह एक सॉर्टेड एरे में से किसी एलिमेंट को खोजने का सबसे तेज़ तरीका है। [pause] यह एल्गोरिदम सर्च स्पेस को हर स्टेप में आधा कर देता है। [pause] इसकी समय जटिलता ओ ऑफ लॉग एन होती है।`,
      slides: [
        {
          title: "बाइनरी सर्च का परिचय",
          points: ["एक कुशल खोज एल्गोरिदम", "सॉर्टेड एरे में तत्वों को खोजता है", "विभाजन और विजय सिद्धांत पर आधारित"]
        },
        {
          title: "शर्ते और जटिलता",
          points: ["एरे का सॉर्टेड होना अनिवार्य है", "समय जटिलता: O(log N)", "स्थान जटिलता: O(1)"]
        },
        {
          title: "चरण-दर-चरण प्रक्रिया",
          points: ["लक्ष्य की तुलना मध्य तत्व से करें", "छोटा होने पर बाईं ओर खोजें", "बड़ा होने पर दाईं ओर खोजें", "अंत तक दोहराएं"]
        },
        {
          title: "फायदे और नुकसान",
          points: ["फायदा: बड़े डेटा के लिए अत्यंत तेज़", "नुकसान: डेटा सॉर्ट करना अनिवार्य है"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Prerequisites & Complexity",
        "Step-by-Step Process",
        "Summary & Trade-offs"
      ],
      visual_suggestions: [
        "low, mid, high पॉइंटर्स के साथ सॉर्टेड एरे",
        "लीनियर सर्च बनाम बाइनरी सर्च का फ्लोचार्ट",
        "हर चरण में एरे का आकार आधा होने का आरेख"
      ]
    }
  },
  "linked list": {
    English: {
      explanation: `# Linked List

### Definition & Introduction
A Linked List is a linear data structure where elements are not stored at contiguous memory locations. Instead, elements are linked using pointers. Each element is called a **Node**, which contains a data field and a reference (link) to the next node in the sequence.

### Structure of a Node
- **Data**: The value stored in the node.
- **Next**: A pointer/reference to the next node in the sequence.
- The first node is the **Head**, and the last node points to **Null**.

### Key Concepts & Types
- **Singly Linked List**: Each node points to the next node only.
- **Doubly Linked List**: Each node has two pointers: one pointing to the next node and another to the previous node.
- **Circular Linked List**: The last node points back to the Head node, forming a loop.

### Operations
- **Insertion**: Adding a node (takes O(1) time if inserting at head/known position).
- **Deletion**: Removing a node (takes O(1) time if pointer is known).
- **Traversal**: Visiting every node (takes O(N) time).

### Advantages & Disadvantages
- **Advantages**: 
  - Dynamic size: Can grow or shrink easily during runtime.
  - Efficient insertion and deletion operations compared to arrays.
- **Disadvantages**:
  - No random access: Must traverse sequentially from the head (O(N) search time).
  - Extra memory: Pointers require additional storage space.`,
      video_script: `Today we will explore Linked Lists. [pause] Unlike arrays, a linked list does not store elements in contiguous memory locations. [pause] Instead, it consists of nodes. Each node contains data and a pointer to the next node. [pause] The list starts at the Head node and ends when a node points to null. [pause] Insertions and deletions are very efficient because we only need to update pointers. [pause] However, searching for an element requires traversing from the head, which takes O of N time.`,
      slides: [
        {
          title: "What is a Linked List?",
          points: ["A linear data structure of connected nodes", "Nodes contain data and pointers", "Elements are not stored contiguously in memory"]
        },
        {
          title: "Node Anatomy & Types",
          points: ["Head: Starting node of the list", "Next Pointer: Address of the next node", "Singly, Doubly, and Circular Linked Lists"]
        },
        {
          title: "Operations & Complexity",
          points: ["Insertion/Deletion: O(1) if position is known", "Search/Traversal: O(N) linear time", "Dynamic size adjustment during runtime"]
        },
        {
          title: "Arrays vs Linked Lists",
          points: ["Arrays have fast O(1) random access but fixed size", "Linked lists have dynamic size but slow O(N) access", "Linked lists use more memory due to pointer storage"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Anatomy & Types",
        "Operations & Complexity",
        "Summary & Comparison"
      ],
      visual_suggestions: [
        "A chain of nodes showing data and next arrows",
        "Comparison table: Arrays vs Linked Lists",
        "Diagram showing Singly, Doubly, and Circular node links"
      ]
    },
    Hinglish: {
      explanation: `# Linked List

### Definition & Introduction
Linked List ek linear data structure hai jisme elements contiguous memory locations par store nahi hote. Isme elements pointers ke through aapas mein connect hote hain. Har element ko **Node** kaha jata hai, jiske paas do main cheezein hoti hain: data aur agle node ka address (pointer).

### Anatomy of a Node
- **Data**: Jo actual value node mein store hoti hai.
- **Next Pointer**: Agle node ka address.
- First node ko **Head** aur last node ke pointer ko **Null** set kiya jata hai.

### Key Types
- **Singly Linked List**: Har node sirf next node ko point karta hai.
- **Doubly Linked List**: Node ke paas previous aur next dono node ka address hota hai.
- **Circular Linked List**: Last node wapas first node (head) ko point karta hai.

### Advantages & Disadvantages
- **Advantages**: Dynamic size hota hai, memory adjust kar sakte hain. Insertion/Deletion fast hai (O(1)).
- **Disadvantages**: Direct index access nahi kar sakte (Traverse karna padta hai, O(N)). Extra memory use hoti hai pointers ke liye.`,
      video_script: `Today we will explore Linked Lists. [pause] Unlike arrays, a linked list does not store elements in contiguous memory locations. [pause] Instead, it consists of nodes. Each node contains data and a pointer to the next node. [pause] The list starts at the Head node and ends when a node points to null. [pause] Insertions and deletions are very efficient because we only need to update pointers. [pause] However, searching for an element requires traversing from the head, which takes O of N time.`,
      slides: [
        {
          title: "Linked List Kya Hai?",
          points: ["Connected nodes ka linear sequence", "Elements contiguous memory mein nahi hote", "Har node pointer ke zariye juda hota hai"]
        },
        {
          title: "Node aur iske types",
          points: ["Node ke do parts: Data aur Next address", "Singly, Doubly, aur Circular Linked Lists", "Head start points ko locate karta hai"]
        },
        {
          title: "Operations aur Complexity",
          points: ["Insertion/Deletion: O(1) constant time", "Traversal/Search: O(N) linear time", "Dynamic resizing during runtime"]
        },
        {
          title: "Pros & Cons",
          points: ["Pro: Dynamic memory usage", "Con: Index-based random access missing", "Con: Extra memory pointer ke liye required"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Anatomy & Types",
        "Operations & Complexity",
        "Summary & Comparison"
      ],
      visual_suggestions: [
        "A chain of nodes showing data and next arrows",
        "Comparison table: Arrays vs Linked Lists",
        "Diagram showing Singly, Doubly, and Circular node links"
      ]
    },
    Hindi: {
      explanation: `# लिंक्ड लिस्ट (Linked List)

### परिभाषा और परिचय
लिंक्ड लिस्ट एक रेखीय (Linear) डेटा संरचना है जिसमें तत्व लगातार मेमोरी स्थानों (Contiguous memory locations) में संग्रहीत नहीं होते हैं। इसके बजाय, तत्व पॉइंटर्स का उपयोग करके जुड़े होते हैं। प्रत्येक तत्व को **नोड (Node)** कहा जाता है, जिसमें डेटा फ़ील्ड और अगले नोड का संदर्भ (लिंक) होता है।

### नोड की संरचना
- **डेटा (Data)**: नोड में संग्रहीत मान।
- **नेक्स्ट (Next Pointer)**: अगले नोड का पता।
- पहले नोड को **हेड (Head)** और अंतिम नोड को **नल (Null)** द्वारा दर्शाया जाता है।

### प्रकार
- **एकल लिंक्ड लिस्ट (Singly Linked List)**: प्रत्येक नोड केवल अगले नोड को इंगित करता है।
- **द्वि-लिंक्ड लिस्ट (Doubly Linked List)**: प्रत्येक नोड में दो पॉइंटर्स होते हैं, जो अगले और पिछले दोनों नोड को इंगित करते हैं।
- **वृत्ताकार लिंक्ड लिस्ट (Circular Linked List)**: अंतिम नोड वापस हेड नोड से जुड़ जाता है।

### लाभ और हानि
- **लाभ**: रनटाइम के दौरान गतिशील रूप से आकार बदल सकता है।
- **हानि**: सीधे इंडेक्स द्वारा तत्वों तक नहीं पहुँचा जा सकता (O(N) समय लगता है)। पॉइंटर्स के कारण अधिक मेमोरी खर्च होती है।`,
      video_script: `आज हम लिंक्ड लिस्ट के बारे में सीखेंगे। [pause] एरे के विपरीत, लिंक्ड लिस्ट लगातार मेमोरी में नहीं होती। [pause] इसमें नोड्स होते हैं जिनमें डेटा और अगले नोड का पॉइंटर होता है। [pause] हेड से शुरू होकर आखिरी नोड नल पर खत्म होता है। [pause] इसमें तत्व जोड़ना और हटाना बहुत आसान है लेकिन खोजना मुश्किल।`,
      slides: [
        {
          title: "लिंक्ड लिस्ट क्या है?",
          points: ["एक रेखीय डेटा संरचना", "तत्व पॉइंटर्स से जुड़े होते हैं", "मेमोरी में नोड्स बिखरे होते हैं"]
        },
        {
          title: "नोड और उसके प्रकार",
          points: ["डेटा और नेक्स्ट पॉइंटर की संरचना", "एकल, द्वि और वृत्ताकार लिंक्ड लिस्ट", "अंतिम नोड नल पर समाप्त होता है"]
        },
        {
          title: "ऑपरेशन्स और जटिलता",
          points: ["नोड जोड़ना/हटाना: O(1)", "तत्व खोजना: O(N)", "आवश्यकतानुसार गतिशील आकार"]
        },
        {
          title: "फायदे और नुकसान",
          points: ["फायदा: मेमोरी का कुशल उपयोग", "नुकसान: कोई रैंडम एक्सेस नहीं", "नुकसान: पॉइंटर्स के लिए अतिरिक्त स्पेस"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Anatomy & Types",
        "Operations & Complexity",
        "Summary & Comparison"
      ],
      visual_suggestions: [
        "नोड्स और पॉइंटर्स की श्रृंखला का आरेख",
        "एरे बनाम लिंक्ड लिस्ट का तुलनात्मक चार्ट",
        "संगली, डबली और सर्कुलर लिंक्ड लिस्ट की लिंकेज"
      ]
    }
  },
  "human heart": {
    English: {
      explanation: `# The Human Heart

### Definition & Function
The Human Heart is a vital muscular organ located in the chest cavity, roughly the size of a closed fist. Its primary function is to act as a pump within the circulatory system, continuously driving blood to deliver oxygen and nutrients to tissues and remove carbon dioxide and metabolic wastes.

### Anatomy of the Heart
The heart is divided into four distinct chambers:
1. **Right Atrium**: Receives oxygen-depleted (deoxygenated) blood from the body via the Vena Cava.
2. **Right Ventricle**: Pumps deoxygenated blood to the lungs through the pulmonary artery.
3. **Left Atrium**: Receives oxygen-rich blood returning from the lungs via the pulmonary veins.
4. **Left Ventricle**: Pumps oxygenated blood to the rest of the body via the Aorta (has the thickest muscular wall).

### The Blood Flow Process (Working Principle)
1. **Reception**: Deoxygenated blood enters the Right Atrium and flows through the tricuspid valve into the Right Ventricle.
2. **Pulmonary Circulation**: The Right Ventricle contract, pushing blood through the pulmonary valve to the lungs for gas exchange.
3. **Return**: Oxygenated blood from the lungs enters the Left Atrium and flows through the mitral (bicuspid) valve into the Left Ventricle.
4. **Systemic Circulation**: The Left Ventricle contracts, forcing oxygen-rich blood through the aortic valve into the Aorta, supplying the entire body.

### Key Concepts
- **Valves**: Tricuspid, Pulmonary, Mitral, and Aortic valves ensure one-way blood flow, preventing backflow.
- **Sinoatrial (SA) Node**: The heart's natural pacemaker, located in the right atrium, generating electrical impulses that control cardiac rhythm.`,
      video_script: `Let's learn about the Human Heart. [pause] The heart is a powerful muscular pump that circulates blood throughout your entire body. [pause] It is divided into four chambers. The top chambers are the right and left atria, and the bottom chambers are the right and left ventricles. [pause] Deoxygenated blood from the body enters the right side of the heart, which pumps it to the lungs to get oxygen. [pause] Oxygenated blood returns to the left side of the heart, which pumps it out to the rest of the body through the aorta. [pause] Valves in the heart ensure that blood flows in only one direction.`,
      slides: [
        {
          title: "Introduction to the Heart",
          points: ["Muscular organ about the size of a fist", "Pumps blood through the circulatory system", "Delivers oxygen and nutrients to cells"]
        },
        {
          title: "The Four Chambers",
          points: ["Right Atrium & Ventricle: Handle deoxygenated blood", "Left Atrium & Ventricle: Handle oxygenated blood", "Valves prevent backflow of blood"]
        },
        {
          title: "Circulatory Path",
          points: ["Pulmonary Circulation: Pumps blood to the lungs", "Systemic Circulation: Pumps blood to the body", "Aorta: Main artery carrying oxygenated blood"]
        },
        {
          title: "Heart Rhythm & Control",
          points: ["Sinoatrial Node: The heart's natural pacemaker", "Electrical signals trigger coordinated contractions", "Double circulation ensures efficient oxygen delivery"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Function",
        "The Four Chambers",
        "Circulatory Pathway",
        "Rhythm & Control Summary"
      ],
      visual_suggestions: [
        "Detailed color diagram of the heart showing chambers and blood flow",
        "Animation showing opening and closing of heart valves",
        "Graph representing systemic vs pulmonary circulation paths"
      ]
    },
    Hinglish: {
      explanation: `# Human Heart

### Definition & Function
Human Heart ek vital muscular organ hai jo hamari chest cavity mein hota hai. Iska size lagbhag ek band mutthi jitna hota hai. Heart ka main kaam body mein blood ko pump karna hai, taaki oxygen aur nutrients sabhi tissues tak pahunch sakein aur carbon dioxide remove ho sake.

### Heart ki Anatomy (Chambers)
Hamare heart mein total chaar (4) chambers hote hain:
1. **Right Atrium**: Body se aane wale bina oxygen ke blood (deoxygenated blood) ko receive karta hai.
2. **Right Ventricle**: Deoxygenated blood ko lungs tak pump karta hai carbon dioxide remove karne ke liye.
3. **Left Atrium**: Lungs se oxygenated blood ko receive karta hai.
4. **Left Ventricle**: Oxygen-rich blood ko poori body mein pump karta hai.

### Blood Flow Kaise Hota Hai?
1. Deoxygenated blood body se Right Atrium mein aata hai, fir tricuspid valve se hokar Right Ventricle mein jata hai.
2. Right Ventricle blood ko lungs mein bhejta hai.
3. Lungs se oxygen lekar blood Left Atrium mein aata hai aur fir Left Ventricle mein jata hai.
4. Left Ventricle Aorta ke zariye blood poori body mein pump karta hai.

### Key Points
- **Valves**: Heart ke valves (tricuspid, mitral, etc.) blood flow ko one-way rakhte hain.
- **SA Node**: Yeh heart ka natural pacemaker hai jo heartbeats generate karta hai.`,
      video_script: `Let's learn about the Human Heart. [pause] The heart is a powerful muscular pump that circulates blood throughout your entire body. [pause] It is divided into four chambers. The top chambers are the right and left atria, and the bottom chambers are the right and left ventricles. [pause] Deoxygenated blood from the body enters the right side of the heart, which pumps it to the lungs to get oxygen. [pause] Oxygenated blood returns to the left side of the heart, which pumps it out to the rest of the body through the aorta. [pause] Valves in the heart ensure that blood flows in only one direction.`,
      slides: [
        {
          title: "Human Heart Ka Parichay",
          points: ["Band mutthi ke size ka muscular organ", "Pumping station jo blood pure body mein supply karta hai", "Oxygen aur nutrients cells tak delivery ensure karta hai"]
        },
        {
          title: "Chaar Chambers aur Valves",
          points: ["Right side: deoxygenated blood flow", "Left side: oxygenated blood flow", "Valves direction correct rakhte hain"]
        },
        {
          title: "Blood Flow Path",
          points: ["Body -> Right Heart -> Lungs -> Left Heart -> Body", "Lungs mein oxygenation carbon dioxide release", "Aorta ke through distribution"]
        },
        {
          title: "Electrical System",
          points: ["Sinoatrial node heart rate command karta hai", "Cardiac cycle contraction and relaxation coordinate karta hai", "Healthy blood pressure maintain karta hai"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Function",
        "The Four Chambers",
        "Circulatory Pathway",
        "Rhythm & Control Summary"
      ],
      visual_suggestions: [
        "Detailed color diagram of the heart showing chambers and blood flow",
        "Animation showing opening and closing of heart valves",
        "Graph representing systemic vs pulmonary circulation paths"
      ]
    },
    Hindi: {
      explanation: `# मानव हृदय (Human Heart)

### परिभाषा और मुख्य कार्य
मानव हृदय एक अत्यंत महत्वपूर्ण पेशीय अंग (Muscular organ) है जो वक्ष गुहा (Chest cavity) में स्थित होता है। इसका प्राथमिक कार्य पूरे शरीर में रक्त पंप करना है, जिससे ऊतकों को ऑक्सीजन और पोषक तत्व प्राप्त होते हैं और कार्बन डाइऑक्साइड बाहर निकलती है।

### हृदय की शारीरिक रचना (Anatomy)
मानव हृदय में चार कक्ष (Chambers) होते हैं:
1. **दायाँ अलिंद (Right Atrium)**: शरीर से ऑक्सीजन रहित (अशुद्ध) रक्त प्राप्त करता है।
2. **दायाँ निलय (Right Ventricle)**: अशुद्ध रक्त को साफ होने के लिए फेफड़ों में पंप करता है।
3. **बायाँ अलिंद (Left Atrium)**: फेफड़ों से ऑक्सीजन युक्त (शुद्ध) रक्त प्राप्त करता है।
4. **बायाँ निलय (Left Ventricle)**: शुद्ध रक्त को महाधमनी (Aorta) के माध्यम से पूरे शरीर में पंप करता है।

### रक्त प्रवाह की प्रक्रिया (Working Principle)
1. शरीर का अशुद्ध रक्त दाएँ अलिंद में आता है और फिर दाएँ निलय में जाता है।
2. दायाँ निलय इसे फेफड़ों में भेजता है जहाँ रक्त ऑक्सीजन लेता है।
3. शुद्ध रक्त फेफड़ों से बाएँ अलिंद में और फिर बाएँ निलय में प्रवेश करता है।
4. बायाँ निलय इस शुद्ध रक्त को पूरे शरीर में प्रसारित करता है।

### महत्वपूर्ण बिंदु
- **हृदय वाल्व (Heart Valves)**: वाल्व रक्त के उल्टे प्रवाह को रोकते हैं।
- **एसए नोड (SA Node)**: इसे हृदय का प्राकृतिक पेसमेकर कहा जाता है, जो विद्युत तरंगें पैदा कर धड़कन नियंत्रित करता है।`,
      video_script: `आज हम मानव हृदय के बारे में जानेंगे। [pause] यह एक पेशीय अंग है जो पूरे शरीर में रक्त पंप करता है। [pause] इसमें चार चैम्बर होते हैं - दो अलिंद और दो निलय। [pause] शरीर का अशुद्ध रक्त दाएं हिस्से में आता है जो इसे फेफड़ों में भेजता है। [pause] फेफड़ों से शुद्ध रक्त बाएं हिस्से में आकर पूरे शरीर में पंप होता है।`,
      slides: [
        {
          title: "हृदय का परिचय",
          points: ["एक मुट्ठी के आकार का पेशीय अंग", "रक्त परिसंचरण तंत्र का मुख्य पंप", "ऑक्सीजन और पोषक तत्व पहुंचाने का माध्यम"]
        },
        {
          title: "चार चैंबर और वाल्व",
          points: ["दायाँ भाग: ऑक्सीजन रहित अशुद्ध रक्त", "बायाँ भाग: ऑक्सीजन युक्त शुद्ध रक्त", "वाल्व रक्त को एक ही दिशा में बहने देते हैं"]
        },
        {
          title: "परिसंचरण मार्ग",
          points: ["फेफड़ों की ओर: रक्त का शुद्धिकरण", "शरीर की ओर: महाधमनी द्वारा वितरण", "निरंतर चलने वाला चक्र"]
        },
        {
          title: "हृदय की धड़कन नियंत्रण",
          points: ["साइनोआट्रियल नोड (SA Node): प्राकृतिक पेसमेकर", "विद्युत आवेग धड़कन पैदा करते हैं", "द्वि-परिसंचरण प्रणाली"]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Function",
        "The Four Chambers",
        "Circulatory Pathway",
        "Rhythm & Control Summary"
      ],
      visual_suggestions: [
        "हृदय के चैंबर्स और रक्त प्रवाह को दर्शाता हुआ रंगीन आरेख",
        "हृदय वाल्वों के खुलने और बंद होने का एनीमेशन",
        "फुफ्फुसीय और दैहिक परिसंचरण का रेखाचित्र"
      ]
    }
  }
};

const levelGuidance = {
  Beginner: "simple idea, key terms, and one easy example",
  Intermediate: "working model, important parts, and practical tradeoffs",
  Advanced: "deeper mechanics, constraints, and expert-level implications"
};

const styleOpeners = {
  Teacher: "Let us understand this step by step.",
  Friend: "Think of it like this.",
  Interviewer: "If I asked you this in an interview, I would expect a clear explanation."
};

async function fetchWikipediaSummary(topic, lang = "en") {
  try {
    const slug = topic.trim().replace(/\s+/g, "_");
    const resp = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { headers: { "User-Agent": "AI-Whiteboard/1.0 (educational-app; contact@localhost)" } }
    );
    if (resp.ok) {
      const data = await resp.json();
      return data.extract || null;
    }
  } catch (err) {
    // Ignore error
  }
  return null;
}

export async function buildFallbackExplanation(input) {
  const topicKey = String(input.topic || "").trim().toLowerCase();
  const language = input.language || "English";
  const level = input.level || "Beginner";
  const style = input.style || "Teacher";

  // Check if it's a known common topic
  if (commonTopics[topicKey] && commonTopics[topicKey][language]) {
    return commonTopics[topicKey][language];
  }

  // Fallback dynamic generation using Wikipedia
  let wikiLang = "en";
  if (language === "Hindi") {
    wikiLang = "hi";
  }

  let wikiExtract = await fetchWikipediaSummary(input.topic, wikiLang);

  // If Wikipedia failed or language was Hinglish, try English Wikipedia as fallback
  if (!wikiExtract && language === "Hinglish") {
    wikiExtract = await fetchWikipediaSummary(input.topic, "en");
  }

  if (!wikiExtract) {
    // Basic static fallback text if Wikipedia fetch fails entirely
    wikiExtract = `${input.topic} is an important topic. Understanding it helps build solid concepts and foundations. At a ${level} level, the focus is on the ${levelGuidance[level]}.`;
  }

  // Localized template generation
  if (language === "Hindi") {
    return {
      explanation: `# ${input.topic}

### परिभाषा और परिचय
${wikiExtract}

### मुख्य विचार और कार्यप्रणाली
**${input.topic}** को समझने के लिए इसके मूल घटकों और उनके बीच के संबंधों को जानना आवश्यक है। 

### अनुप्रयोग और उपयोग
- विभिन्न शैक्षणिक और व्यावसायिक क्षेत्रों में बड़े पैमाने पर उपयोग किया जाता है।
- समस्याओं को व्यवस्थित और कुशल तरीके से हल करने में मदद करता है।

### लाभ और सीमाएं
- **लाभ**: यह अत्यधिक उपयोगी, संरचित और व्यापक रूप से समर्थित है।
- **सीमाएं**: इसके उपयोग के लिए प्रारंभिक समझ और कुछ शर्तों का पालन आवश्यक हो सकता है।`,
      video_script: `${styleOpeners[style]} [pause] आज हम ${input.topic} के बारे में विस्तार से सीखेंगे। [pause] सबसे पहले इसकी बुनियादी परिभाषा देखें: ${wikiExtract.slice(0, 120)}... [pause] इसके बाद हम इसके कार्य सिद्धांतों और मुख्य उदाहरणों पर चर्चा करेंगे। [pause] अंत में हम इसके मुख्य लाभ और सीमाओं को संक्षेप में समझेंगे।`,
      slides: [
        {
          title: `${input.topic} का परिचय`,
          points: [
            `परिभाषा: ${wikiExtract.slice(0, 80)}...`,
            `मुख्य उद्देश्य और सिद्धांत`,
            `${level} स्तर पर अवधारणा की समझ`
          ]
        },
        {
          title: "कार्य सिद्धांत और प्रक्रिया",
          points: [
            "बुनियादी कार्यप्रणाली और संरचना",
            "आवश्यक शर्तें और नियम",
            "चरण-दर-चरण कार्य करने का तरीका"
          ]
        },
        {
          title: "अनुप्रयोग और उपयोग के मामले",
          points: [
            "व्यावहारिक जीवन में इसका उपयोग",
            "समस्या निवारण में महत्व",
            "एक व्यावहारिक उदाहरण"
          ]
        },
        {
          title: "लाभ और सीमाएं",
          points: [
            "मुख्य लाभ और खूबियां",
            "संभावित चुनौतियां और सीमाएं",
            "संक्षेप और निष्कर्ष"
          ]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "परिचय और परिभाषा",
        "कार्य सिद्धांत",
        "व्यावहारिक अनुप्रयोग",
        "लाभ और निष्कर्ष"
      ],
      visual_suggestions: [
        `${input.topic} की संरचना को दर्शाता हुआ एक सरल आरेख`,
        "महत्वपूर्ण बिंदुओं और उदाहरणों को प्रदर्शित करने वाले प्रतीक (Icons)"
      ]
    };
  }

  if (language === "Hinglish") {
    return {
      explanation: `# ${input.topic}

### Definition & Introduction
${wikiExtract}

### Core Concepts & Working Principle
**${input.topic}** ko samajhne ke liye iske key components aur working rules ko samajhna zaroori hai. At a **${level}** level, hamara main focus iske flow aur application par hona chahiye.

### Use Cases & Applications
- Bohot saare academic aur professional fields mein iska use kiya jata hai.
- Complex problems ko easily solve karne mein help karta hai.

### Advantages & Disadvantages
- **Advantages**: Bahut reliable, simple, aur standard approach hai.
- **Disadvantages**: Prerequisite concepts clear hone chahiye tabhi iska use samajh aata hai.`,
      video_script: `${styleOpeners[style]} [pause] Aaj hum ${input.topic} ke baare mein simple Hinglish mein samjhenge. [pause] Pehle iska basic meaning dekhte hain: ${wikiExtract.slice(0, 120)}... [pause] Phir hum iske core principles aur practical examples ke baare mein baat karenge. [pause] Last mein iske pros aur cons dekh kar ek quick recap karenge.`,
      slides: [
        {
          title: `Introduction to ${input.topic}`,
          points: [
            `Definition: ${wikiExtract.slice(0, 80)}...`,
            `${input.topic} ka core purpose kya hai`,
            `${level} difficulty ke according concepts`
          ]
        },
        {
          title: "Working Principles",
          points: [
            "Iska basic operation aur structure",
            "Kaam karne ke specific rules aur prerequisites",
            "Step-by-step process flow"
          ]
        },
        {
          title: "Applications & Use Cases",
          points: [
            "Real-world problems mein iska role",
            "Common scenario jahan iska use hota hai",
            "Ek practical example"
          ]
        },
        {
          title: "Advantages & Limitations",
          points: [
            "Iske main positive points aur advantages",
            "Kuch limitations aur disadvantages",
            "Quick recap aur summary"
          ]
        }
      ],
      scenes: [
        "Hook (5 sec)",
        "Introduction & Definition",
        "Working Principles",
        "Practical Use Cases",
        "Summary & Recap"
      ],
      visual_suggestions: [
        `${input.topic} ke components ko dikhata hua clean diagram`,
        "Icons for ideas, process steps, advantages, and summary"
      ]
    };
  }

  // English fallback
  return {
    explanation: `# ${input.topic}

### Definition & Introduction
${wikiExtract}

### Core Concepts & Working Principles
To understand **${input.topic}** thoroughly at an **${level}** level, it is essential to look at its core components and working rules. The concept relies on structured patterns, specific actions, and direct relationships to perform its main tasks.

### Practical Applications & Use Cases
- Widely applied in educational, technical, and scientific fields.
- Solves problems by organizing, processing, or clarifying information efficiently.

### Advantages & Disadvantages
- **Advantages**: Highly efficient, standardized, and extensively documented.
- **Disadvantages**: May require setup time and a clear understanding of prerequisites.`,
    video_script: `${styleOpeners[style]} [pause] Today we will learn about ${input.topic} in detail. [pause] First, let's look at the basic definition: ${wikiExtract.slice(0, 120)}... [pause] Next, we will explore the core concepts and working principles. [pause] Finally, we will outline the main advantages and drawbacks to wrap up our summary.`,
    slides: [
      {
        title: `Introduction to ${input.topic}`,
        points: [
          `Definition: ${wikiExtract.slice(0, 80)}...`,
          `Core purpose and main goals`,
          `Understanding concepts at ${level} level`
        ]
      },
      {
        title: "Working Principles",
        points: [
          "Key components and interactions",
          "Rules and prerequisites of the concept",
          "Step-by-step processing logic"
        ]
      },
      {
        title: "Applications & Use Cases",
        points: [
          "Real-world application scenarios",
          "Solving standard problems in the domain",
          "A practical example breakdown"
        ]
      },
      {
        title: "Pros & Cons",
        points: [
          "Key advantages and highlights",
          "Potential drawbacks and limitations",
          "Summary and final takeaways"
        ]
      }
    ],
    scenes: [
      "Hook (5 sec)",
      "Introduction & Definition",
      "Core Concepts & Principles",
      "Practical Applications",
      "Summary & Wrap-up"
    ],
    visual_suggestions: [
      `A clear diagram representing the structure of ${input.topic}`,
      "Icons for introduction, working concept, examples, and summary"
    ]
  };
}
