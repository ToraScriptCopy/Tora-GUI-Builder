const elements = [];
const formsContainer = document.getElementById('forms');
const previewArea = document.getElementById('preview-area');
const luaOutput = document.getElementById('lua-output');
const downloadBtn = document.getElementById('download-btn');
const errorModal = document.getElementById('error-modal');
const errorMsg = document.getElementById('error-msg');
const closeModal = document.getElementById('close-modal');

document.querySelectorAll('.elem-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    addForm(type);
  });
});

function addForm(type) {
  const idx = elements.length;
  const form = document.createElement('div');
  form.className = 'elem-form';
  form.innerHTML = `
    <h3>${type} ${idx+1}</h3>
    <label>Name: <input class="name-input" /></label>
    <label>Function: <textarea class="func-input" rows="3">function()\n  -- code\nend</textarea></label>
    <button class="remove-btn">Remove</button>
  `;
  formsContainer.appendChild(form);
  elements.push({ type, name: '', func: '' });

  const nameIn = form.querySelector('.name-input');
  const funcIn = form.querySelector('.func-input');
  const remBtn = form.querySelector('.remove-btn');

  nameIn.addEventListener('input', () => {
    elements[idx].name = nameIn.value || type;
    render();
  });
  funcIn.addEventListener('input', () => {
    elements[idx].func = funcIn.value;
    render();
  });
  remBtn.addEventListener('click', () => {
    elements.splice(idx,1);
    form.remove();
    render();
    generateLua();
  });
  render();
}

function render() {
  previewArea.innerHTML = '';
  elements.forEach(el => {
    let node;
    switch(el.type) {
      case 'Toggle':
        node = document.createElement('label');
        node.innerHTML = `<input type="checkbox" disabled /> ${el.name}`;
        break;
      case 'Button':
        node = document.createElement('button');
        node.textContent = el.name;
        node.disabled = true;
        break;
      case 'Slider':
        node = document.createElement('input');
        node.type = 'range';
        node.disabled = true;
        break;
      case 'TextBox':
        node = document.createElement('input');
        node.type = 'text';
        node.placeholder = el.name;
        node.disabled = true;
        break;
      case 'Label':
        node = document.createElement('div');
        node.textContent = el.name;
        break;
    }
    previewArea.appendChild(node);
  });
  generateLua();
}

function generateLua() {
  try {
    let code = [];
    code.push('local library = loadstring(game:HttpGet("https://raw.githubusercontent.com/liebertsx/Tora-Library/main/src/library", true))()');
    code.push('local window = library:CreateWindow("My GUI")');
    code.push('local folder = window:AddFolder("Main")');
    elements.forEach(el => {
      if (!/^function[\s\S]*end$/.test(el.func.trim())) {
        throw new Error(`Invalid function for ${el.type}: must start with 'function' and end with 'end'`);
      }
      switch(el.type) {
        case 'Toggle':
          code.push(`folder:AddToggle({ text="${el.name}", flag="${el.name.replace(/\s+/g,'_')}", callback=${el.func} })`);
          break;
        case 'Button':
          code.push(`folder:AddButton({ text="${el.name}", callback=${el.func} })`);
          break;
        case 'Slider':
          code.push(`folder:AddSlider({ text="${el.name}", min=0, max=100, value=50, decimals=0, callback=${el.func} })`);
          break;
        case 'TextBox':
          code.push(`folder:AddTextBox({ text="${el.name}", flag="${el.name.replace(/\s+/g,'_')}", callback=${el.func} })`);
          break;
        case 'Label':
          code.push(`folder:AddLabel({ text="${el.name}", type="label" })`);
          break;
      }
    });
    code.push('library:Init()');
    luaOutput.textContent = code.join('\n');
    return code.join('\n');
  } catch(err) {
    showError(err.message);
    return '';
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorModal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => {
  errorModal.classList.add('hidden');
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([luaOutput.textContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tora_gui.lua';
  link.click();
});
