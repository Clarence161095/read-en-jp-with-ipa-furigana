import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

// Script to inject into HTML for better mobile touch behavior
const MOBILE_TOUCH_SCRIPT = `
<script>
(function() {
  // Better mobile touch: tap to toggle tooltip, tap elsewhere to hide
  var isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isMobile) return;

  var activePhrase = null;
  var tooltip = document.getElementById('custom-tooltip');
  if (!tooltip) return;

  // Remove all existing touch listeners by cloning phrases
  document.querySelectorAll('.phrase').forEach(function(el) {
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  });

  // Re-attach desktop hover listeners
  document.querySelectorAll('.phrase').forEach(function(el) {
    el.addEventListener('mouseenter', function() { showTipFor(el); });
    el.addEventListener('mousemove', function() { showTipFor(el); });
    el.addEventListener('mouseleave', function() { hideTipFn(); });
  });

  function showTipFor(el) {
    var t = el.dataset.tooltip;
    if (!t) return;
    tooltip.textContent = t;
    tooltip.style.display = 'block';
    var r = el.getBoundingClientRect();
    tooltip.style.left = (r.left + r.width/2 + (window.scrollX||pageXOffset)) + 'px';
    tooltip.style.top = (r.bottom + (window.scrollY||pageYOffset)) + 'px';
  }

  function hideTipFn() {
    tooltip.style.display = 'none';
    if (activePhrase) {
      activePhrase.style.borderBottom = '2px dashed transparent';
      activePhrase = null;
    }
  }

  // Mobile tap handler
  document.addEventListener('click', function(e) {
    var phrase = e.target.closest('.phrase');
    
    if (phrase) {
      e.preventDefault();
      e.stopPropagation();
      
      if (activePhrase === phrase) {
        // Tap same phrase again = hide
        hideTipFn();
      } else {
        // Tap new phrase = show
        if (activePhrase) {
          activePhrase.style.borderBottom = '2px dashed transparent';
        }
        activePhrase = phrase;
        phrase.style.borderBottom = '2px dashed #007bff';
        showTipFor(phrase);
      }
    } else if (!e.target.closest('.settings-panel') && !e.target.closest('.settings-btn') && !e.target.closest('.ipa-toggle-btn')) {
      // Tap outside phrase (and not on settings) = hide
      hideTipFn();
    }
  }, true);

  // Prevent the original double-tap zoom prevention from interfering
  document.removeEventListener('touchend', arguments.callee);
})();
</script>
`;

// GET /api/articles/[id]/raw - Serve raw HTML content for iframe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Increment view count
  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  try {
    const filePath = path.join(process.cwd(), article.htmlFilePath);
    let content = await readFile(filePath, 'utf-8');

    // Inject mobile touch script before </body>
    if (content.includes('</body>')) {
      content = content.replace('</body>', MOBILE_TOUCH_SCRIPT + '</body>');
    } else {
      content = content + MOBILE_TOUCH_SCRIPT;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
