---
allowed-tools: Read, Write, Edit, LS, Bash, WebFetch, mcp__backlog__get_issue, mcp__backlog__get_project
description: 作業が上手く進まなかった場合の振り返りと改善を行うコマンド
---

## 概要

作業が難航したPRを分析し、プロンプトの改善やドキュメントの整備を行うコマンドです。

**使用方法**: `/improve-workflow <PR URL>`

## 処理フロー

### 1. コンテキスト収集

PRのURL（$ARGUMENTS）から以下の情報を収集：

```bash
# PR情報を取得
gh pr view $ARGUMENTS --json number,title,body,author,url,state

# 関連するIssue情報を取得
gh pr view $ARGUMENTS --json body | grep -E "Closes #[0-9]+" | sed 's/.*#\([0-9]\+\).*/\1/'

# Backlog情報を抽出（PR本文から）
gh pr view $ARGUMENTS --json body | grep -E "Backlog.*NITOEL_ANNOTATION-[0-9]+"
```

### 2. 問題分析

収集した情報から以下を分析：

#### a) タイムライン分析
- PRの作成から解決までの時間
- コミット履歴から試行錯誤の痕跡を確認
- どの段階で時間がかかったか

#### b) 問題の種類を特定
1. **理解不足型**: Issueの内容が曖昧、詳細不足
2. **調査不足型**: 症状への対処に終始、根本原因未調査
3. **実装ミス型**: 間違ったファイル/エンドポイントを修正
4. **テスト不足型**: TDDが機能せず、問題発見が遅れた

#### c) 関連ファイルの確認
- 修正されたファイルのリスト
- 最終的な解決策と初期アプローチの差分

### 3. 改善提案の生成

#### a) プロンプト改善
対象プロンプトの確認と改善案：
- `.claude/commands/create-issue-from-backlog.md`
- `.claude/commands/issue-task-run.md`

改善ポイント：
- より詳細な情報収集の手順
- 根本原因調査の強調
- エンドポイント/機能の正確な特定

#### b) ドキュメント作成
必要に応じて`docs/ai/`配下に：
- 問題パターンと解決策のガイド
- デバッグ手法のドキュメント
- よくある落とし穴と回避方法

#### c) プロセス改善
- Backlog → Issue作成時のチェックリスト
- Issue → PR作成時の確認事項
- レビュー時の注意点

### 4. 改善の実装

#### a) プロンプトファイルの更新
```markdown
# 改善案をEditツールで適用
- 問題分析で見つかった課題に対応する記述を追加
- より明確な手順や確認事項を追加
```

#### b) ドキュメントの作成/更新
```markdown
# 必要なドキュメントをWriteツールで作成
- docs/ai/配下に適切な番号で作成
- 000-index.mdも更新
```

#### c) チェックリストの作成
必要に応じて以下を作成：
- `.claude/checklists/before-creating-issue.md`
- `.claude/checklists/debugging-guide.md`

### 5. 改善内容の記録

#### 改善サマリーの作成
以下の内容を含むサマリーを生成：
1. **問題の概要**: 何が起きたか
2. **原因分析**: なぜ時間がかかったか
3. **実施した改善**: 
   - プロンプトの変更点
   - 作成したドキュメント
   - プロセスの改善点
4. **今後の効果**: 同様の問題を防ぐ方法

### 6. 完了処理

1. 改善内容をコミット
2. 改善サマリーを表示
3. 必要に応じてPRやIssueにコメント追加

## エラーハンドリング

- PR URLが無効な場合はエラーメッセージ
- Backlog情報が取得できない場合は、利用可能な情報で分析
- プロンプトファイルが見つからない場合は新規作成を提案

## 使用例

```
/improve-workflow https://github.com/Nitoel/annotator-front/pull/61
```

このコマンドにより、今回のような「null値処理で時間がかかった」ケースを分析し、
将来同様の問題を防ぐための改善を自動的に実施します。