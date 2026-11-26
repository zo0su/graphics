/*
 * 차시별 핵심 정리 퀴즈
 * 사용법: <div class="lq-mount" data-lesson="3"></div> 를 두고
 *         questions.js → quiz.js 순서로 불러오면 해당 차시 퀴즈가 그려집니다.
 *         quiz/index.html?lesson=3 처럼 단독 페이지로도 열 수 있습니다.
 */
(function () {
  'use strict';

  var CIRCLED = ['①', '②', '③', '④', '⑤'];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // 단답형 비교용 정규화: 공백·대소문자·따옴표 종류·끝 마침표 무시
  function normalize(s) {
    return String(s)
      .normalize('NFC')
      .toLowerCase()
      .replace(/[“”"‘’`]/g, "'")
      .replace(/\s+/g, '')
      .replace(/[.。]+$/, '');
  }

  function renderQuiz(mount, lessonNo) {
    var data = window.LESSON_QUIZ && window.LESSON_QUIZ[lessonNo];
    if (!data) {
      mount.textContent = lessonNo + '차시 퀴즈 문항을 찾을 수 없습니다.';
      return;
    }

    var items = [];
    var root = el('section', 'lq');
    root.setAttribute('aria-label', data.title + ' 핵심 정리 퀴즈');

    var head = el('div', 'lq-head');
    head.appendChild(el('h2', null, '📝 핵심 정리 퀴즈'));
    head.appendChild(el('p', null,
      '총 ' + data.questions.length + '문제 · 답을 고르거나 입력한 뒤 [정답 확인]을 누르세요. 단답형은 띄어쓰기와 대소문자를 구분하지 않습니다.'));
    root.appendChild(head);

    var list = el('div', 'lq-list');
    root.appendChild(list);

    data.questions.forEach(function (qd, i) {
      items.push(buildItem(qd, i, lessonNo));
      list.appendChild(items[i].node);
    });

    // 하단 점수 바
    var bar = el('div', 'lq-bar');
    var score = el('div', 'lq-score');
    var btnRow = el('div', 'lq-row');
    var gradeAll = el('button', 'lq-btn primary', '전체 채점');
    var reset = el('button', 'lq-btn', '다시 풀기');
    gradeAll.type = 'button';
    reset.type = 'button';
    btnRow.appendChild(gradeAll);
    btnRow.appendChild(reset);
    bar.appendChild(score);
    bar.appendChild(btnRow);
    root.appendChild(bar);

    var result = el('div', 'lq-result');
    result.hidden = true;
    root.appendChild(result);

    function update() {
      var checked = 0, correct = 0;
      items.forEach(function (it) {
        if (it.state.checked) {
          checked++;
          if (it.state.correct) correct++;
        }
      });
      score.textContent = '맞힌 문제 ' + correct + ' / ' + items.length;
      var small = el('small', null, '(확인한 문제 ' + checked + '개)');
      score.appendChild(small);
      gradeAll.disabled = checked === items.length;

      if (checked === items.length) {
        var pct = Math.round((correct / items.length) * 100);
        result.hidden = false;
        result.innerHTML = '';
        result.appendChild(el('strong', null, correct + ' / ' + items.length + ' (' + pct + '점)'));
        result.appendChild(el('span', null,
          pct === 100 ? '완벽해요! 모든 핵심 내용을 이해했어요. 🎉' :
          pct >= 80 ? '잘했어요! 틀린 문제의 해설을 한 번 더 읽어 보세요.' :
          pct >= 50 ? '조금만 더! 틀린 문제와 관련된 수업 내용을 다시 확인해 보세요.' :
          '수업 내용을 다시 읽고 [다시 풀기]로 도전해 보세요.'));
      } else {
        result.hidden = true;
      }
    }

    items.forEach(function (it) { it.onChange = update; });

    gradeAll.addEventListener('click', function () {
      items.forEach(function (it) { if (!it.state.checked) it.check(true); });
      update();
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    reset.addEventListener('click', function () {
      items.forEach(function (it) { it.reset(); });
      update();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    mount.innerHTML = '';
    mount.appendChild(root);
    update();
  }

  function buildItem(qd, idx, lessonNo) {
    var state = { checked: false, correct: false };
    var api = { state: state, onChange: function () {} };
    var name = 'lq-' + lessonNo + '-' + idx;

    var node = el('div', 'lq-item');
    var q = el('div', 'lq-q');
    q.appendChild(el('span', 'lq-num', (idx + 1) + '.'));
    q.appendChild(el('span', 'lq-text', qd.q));
    q.appendChild(el('span', 'lq-tag', qd.type === 'mc' ? '선택형' : '단답형'));
    node.appendChild(q);

    if (qd.code) node.appendChild(el('pre', 'lq-code', qd.code));

    var body = el('div', 'lq-body');
    node.appendChild(body);

    var choiceNodes = [], input = null;
    var checkBtn = el('button', 'lq-btn primary', '정답 확인');
    checkBtn.type = 'button';
    checkBtn.disabled = true;

    if (qd.type === 'mc') {
      var ul = el('ul', 'lq-choices');
      qd.choices.forEach(function (c, ci) {
        var li = el('li');
        var label = el('label', 'lq-choice');
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = name;
        radio.value = String(ci);
        radio.addEventListener('change', function () {
          choiceNodes.forEach(function (n) { n.label.classList.remove('is-picked'); });
          label.classList.add('is-picked');
          checkBtn.disabled = false;
        });
        label.appendChild(radio);
        label.appendChild(el('span', null, CIRCLED[ci] + ' ' + c));
        li.appendChild(label);
        ul.appendChild(li);
        choiceNodes.push({ label: label, radio: radio });
      });
      body.appendChild(ul);
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'lq-input';
      input.placeholder = '답을 입력하세요';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.addEventListener('input', function () { checkBtn.disabled = input.value.trim() === ''; });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.isComposing && input.value.trim() !== '') { e.preventDefault(); api.check(); }
      });
      body.appendChild(input);
    }

    var row = el('div', 'lq-row');
    row.appendChild(checkBtn);
    body.appendChild(row);

    var fb = el('div', 'lq-feedback');
    fb.hidden = true;
    node.appendChild(fb);

    checkBtn.addEventListener('click', function () { api.check(); });

    api.check = function (silent) {
      if (state.checked) return;
      var answered, correct, picked = -1;
      if (qd.type === 'mc') {
        choiceNodes.forEach(function (n, ci) { if (n.radio.checked) picked = ci; });
        answered = picked !== -1;
        correct = picked === qd.answer;
        choiceNodes.forEach(function (n, ci) {
          n.radio.disabled = true;
          if (ci === qd.answer) n.label.classList.add('is-answer');
          else if (ci === picked) n.label.classList.add('is-wrong');
        });
        body.classList.add('lq-locked');
      } else {
        var v = normalize(input.value);
        answered = input.value.trim() !== '';
        correct = answered && qd.answer.some(function (a) { return normalize(a) === v; });
        input.readOnly = true;
      }
      state.checked = true;
      state.correct = correct;
      node.classList.add(correct ? 'is-ok' : 'is-bad');
      checkBtn.hidden = true;

      fb.innerHTML = '';
      var verdict = correct ? '⭕ 정답입니다!' : (answered ? '❌ 오답입니다.' : '❌ 답을 입력하지 않았어요.');
      fb.appendChild(el('div', 'lq-verdict', verdict));
      if (!correct) {
        var ans = qd.type === 'mc'
          ? '정답: ' + CIRCLED[qd.answer] + ' ' + qd.choices[qd.answer]
          : '정답: ' + qd.answer[0];
        fb.appendChild(el('div', 'lq-answer', ans));
      }
      if (qd.explain) fb.appendChild(el('div', 'lq-explain', '💡 ' + qd.explain));
      fb.hidden = false;
      if (!silent) api.onChange();
    };

    api.reset = function () {
      state.checked = false;
      state.correct = false;
      node.classList.remove('is-ok', 'is-bad');
      body.classList.remove('lq-locked');
      fb.hidden = true;
      fb.innerHTML = '';
      checkBtn.hidden = false;
      checkBtn.disabled = true;
      if (qd.type === 'mc') {
        choiceNodes.forEach(function (n) {
          n.radio.checked = false;
          n.radio.disabled = false;
          n.label.classList.remove('is-picked', 'is-answer', 'is-wrong');
        });
      } else {
        input.value = '';
        input.readOnly = false;
      }
    };

    api.node = node;
    return api;
  }

  function init() {
    var mounts = document.querySelectorAll('.lq-mount');
    for (var i = 0; i < mounts.length; i++) {
      var m = mounts[i];
      var n = m.getAttribute('data-lesson');
      if (!n) {
        var p = new URLSearchParams(location.search).get('lesson');
        n = p || '';
      }
      // 숫자 차시(1~21)뿐 아니라 'ps1' 같은 문자 키도 쓰므로 문자열 그대로 넘김
      if (n) renderQuiz(m, n.trim());
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
