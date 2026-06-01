import pytest
from unittest.mock import Mock
import uuid
from services.notebook_context import NotebookContextService, NoSourceContextError
import models


@pytest.fixture
def mock_db():
    """Fixture for mocked database session"""
    return Mock()


@pytest.fixture
def context_service(mock_db):
    """Fixture for NotebookContextService with mocked db"""
    return NotebookContextService(db=mock_db, context_char_limit=1000)


@pytest.fixture
def sample_notebook():
    """Fixture for sample notebook"""
    notebook = Mock(spec=models.Notebook)
    notebook.id = uuid.uuid4()
    notebook.user_id = uuid.uuid4()
    notebook.title = "Test Notebook"
    return notebook


@pytest.fixture
def sample_book():
    """Fixture for sample book"""
    book = Mock(spec=models.Book)
    book.id = uuid.uuid4()
    book.title = "Test Book"
    return book


class TestNotebookContextServiceSuccess:
    """Test successful context building operations"""

    def test_build_context_with_single_source(
        self, context_service, mock_db, sample_notebook, sample_book
    ):
        """Test building context from a single source document"""
        notebook_id = sample_notebook.id
        user_id = sample_notebook.user_id

        # Mock notebook query
        mock_db.query.return_value.filter.return_value.first.return_value = sample_notebook

        # Mock notebook sources query
        source = Mock(spec=models.NotebookSource)
        source.book_id = sample_book.id
        source.created_at = "2024-01-01"

        mock_sources_query = Mock()
        mock_sources_query.filter.return_value.order_by.return_value.all.return_value = [source]

        # Mock book query
        mock_book_query = Mock()
        mock_book_query.filter.return_value.first.return_value = sample_book

        # Mock book contents query
        content1 = Mock(spec=models.BookContent)
        content1.id = uuid.uuid4()
        content1.content = "This is the first content block."
        content1.position = "1"

        content2 = Mock(spec=models.BookContent)
        content2.id = uuid.uuid4()
        content2.content = "This is the second content block."
        content2.position = "2"

        mock_contents_query = Mock()
        mock_contents_query.filter.return_value.order_by.return_value.all.return_value = [
            content1,
            content2,
        ]

        # Setup query mock to return different results based on model
        def query_side_effect(model):
            if model == models.Notebook:
                return mock_db.query.return_value
            elif model == models.NotebookSource:
                return mock_sources_query
            elif model == models.Book:
                return mock_book_query
            elif model == models.BookContent:
                return mock_contents_query
            return Mock()

        mock_db.query.side_effect = query_side_effect

        result = context_service.build_context_for_notebook(notebook_id, user_id)

        assert "context_text" in result
        assert "Test Book" in result["context_text"]
        assert "first content block" in result["context_text"]
        assert "second content block" in result["context_text"]
        assert result["truncated"] is False
        assert len(result["sources"]) == 1
        assert result["sources"][0]["book_title"] == "Test Book"

    def test_build_context_with_multiple_sources(
        self, context_service, mock_db, sample_notebook
    ):
        """Test building context from multiple source documents"""
        notebook_id = sample_notebook.id
        user_id = sample_notebook.user_id

        # Mock notebook query
        mock_db.query.return_value.filter.return_value.first.return_value = sample_notebook

        # Mock two notebook sources
        book1 = Mock(spec=models.Book)
        book1.id = uuid.uuid4()
        book1.title = "Book One"

        book2 = Mock(spec=models.Book)
        book2.id = uuid.uuid4()
        book2.title = "Book Two"

        source1 = Mock(spec=models.NotebookSource)
        source1.book_id = book1.id
        source1.created_at = "2024-01-01"

        source2 = Mock(spec=models.NotebookSource)
        source2.book_id = book2.id
        source2.created_at = "2024-01-02"

        mock_sources_query = Mock()
        mock_sources_query.filter.return_value.order_by.return_value.all.return_value = [
            source1,
            source2,
        ]

        # Mock book queries
        book_query_results = {book1.id: book1, book2.id: book2}

        def book_query_side_effect(*args, **kwargs):
            mock_result = Mock()
            mock_result.filter.return_value.first.side_effect = lambda: book_query_results.get(
                args[0] if args else None
            )
            return mock_result

        # Mock book contents
        content1 = Mock(spec=models.BookContent)
        content1.id = uuid.uuid4()
        content1.content = "Content from book one."
        content1.position = "1"

        content2 = Mock(spec=models.BookContent)
        content2.id = uuid.uuid4()
        content2.content = "Content from book two."
        content2.position = "1"

        def contents_query_side_effect(*args, **kwargs):
            mock_result = Mock()
            book_id = None

            def filter_side_effect(*filter_args, **filter_kwargs):
                nonlocal book_id
                # Extract book_id from filter call
                return mock_result

            mock_result.filter.side_effect = filter_side_effect
            mock_result.order_by.return_value.all.return_value = []
            return mock_result

        # Simplified mock setup
        call_count = [0]

        def query_side_effect(model):
            if model == models.Notebook:
                return mock_db.query.return_value
            elif model == models.NotebookSource:
                return mock_sources_query
            elif model == models.Book:
                call_count[0] += 1
                mock_result = Mock()
                if call_count[0] == 1:
                    mock_result.filter.return_value.first.return_value = book1
                else:
                    mock_result.filter.return_value.first.return_value = book2
                return mock_result
            elif model == models.BookContent:
                call_count[0] += 1
                mock_result = Mock()
                if call_count[0] <= 3:
                    mock_result.filter.return_value.order_by.return_value.all.return_value = [content1]
                else:
                    mock_result.filter.return_value.order_by.return_value.all.return_value = [content2]
                return mock_result
            return Mock()

        mock_db.query.side_effect = query_side_effect

        result = context_service.build_context_for_notebook(notebook_id, user_id)

        assert "Book One" in result["context_text"]
        assert "Book Two" in result["context_text"]
        assert len(result["sources"]) == 2

    def test_context_truncation_at_limit(self, mock_db, sample_notebook, sample_book):
        """Test that context is truncated when exceeding character limit"""
        service = NotebookContextService(db=mock_db, context_char_limit=100)

        notebook_id = sample_notebook.id
        user_id = sample_notebook.user_id

        # Mock notebook query
        mock_db.query.return_value.filter.return_value.first.return_value = sample_notebook

        # Mock notebook source
        source = Mock(spec=models.NotebookSource)
        source.book_id = sample_book.id
        source.created_at = "2024-01-01"

        mock_sources_query = Mock()
        mock_sources_query.filter.return_value.order_by.return_value.all.return_value = [source]

        # Mock book query
        mock_book_query = Mock()
        mock_book_query.filter.return_value.first.return_value = sample_book

        # Mock long content that exceeds limit
        content = Mock(spec=models.BookContent)
        content.id = uuid.uuid4()
        content.content = "A" * 200  # 200 chars, exceeds 100 char limit
        content.position = "1"

        mock_contents_query = Mock()
        mock_contents_query.filter.return_value.order_by.return_value.all.return_value = [content]

        def query_side_effect(model):
            if model == models.Notebook:
                return mock_db.query.return_value
            elif model == models.NotebookSource:
                return mock_sources_query
            elif model == models.Book:
                return mock_book_query
            elif model == models.BookContent:
                return mock_contents_query
            return Mock()

        mock_db.query.side_effect = query_side_effect

        result = service.build_context_for_notebook(notebook_id, user_id)

        assert result["truncated"] is True
        assert result["total_chars"] <= 100


class TestNotebookContextServiceErrors:
    """Test error handling in context service"""

    def test_no_source_error_when_no_sources_attached(
        self, context_service, mock_db, sample_notebook
    ):
        """Test NoSourceContextError when notebook has no attached sources"""
        notebook_id = sample_notebook.id
        user_id = sample_notebook.user_id

        # Mock notebook query
        mock_db.query.return_value.filter.return_value.first.return_value = sample_notebook

        # Mock empty notebook sources
        mock_sources_query = Mock()
        mock_sources_query.filter.return_value.order_by.return_value.all.return_value = []

        def query_side_effect(model):
            if model == models.Notebook:
                return mock_db.query.return_value
            elif model == models.NotebookSource:
                return mock_sources_query
            return Mock()

        mock_db.query.side_effect = query_side_effect

        with pytest.raises(NoSourceContextError) as exc_info:
            context_service.build_context_for_notebook(notebook_id, user_id)

        assert "no attached source documents" in str(exc_info.value).lower()

    def test_no_source_error_when_sources_have_no_content(
        self, context_service, mock_db, sample_notebook, sample_book
    ):
        """Test NoSourceContextError when sources have no extractable content"""
        notebook_id = sample_notebook.id
        user_id = sample_notebook.user_id

        # Mock notebook query
        mock_db.query.return_value.filter.return_value.first.return_value = sample_notebook

        # Mock notebook source
        source = Mock(spec=models.NotebookSource)
        source.book_id = sample_book.id
        source.created_at = "2024-01-01"

        mock_sources_query = Mock()
        mock_sources_query.filter.return_value.order_by.return_value.all.return_value = [source]

        # Mock book query
        mock_book_query = Mock()
        mock_book_query.filter.return_value.first.return_value = sample_book

        # Mock empty book contents
        mock_contents_query = Mock()
        mock_contents_query.filter.return_value.order_by.return_value.all.return_value = []

        def query_side_effect(model):
            if model == models.Notebook:
                return mock_db.query.return_value
            elif model == models.NotebookSource:
                return mock_sources_query
            elif model == models.Book:
                return mock_book_query
            elif model == models.BookContent:
                return mock_contents_query
            return Mock()

        mock_db.query.side_effect = query_side_effect

        with pytest.raises(NoSourceContextError) as exc_info:
            context_service.build_context_for_notebook(notebook_id, user_id)

        assert "no extractable content" in str(exc_info.value).lower()

    def test_value_error_when_notebook_not_found(self, context_service, mock_db):
        """Test ValueError when notebook doesn't exist or access denied"""
        notebook_id = uuid.uuid4()
        user_id = uuid.uuid4()

        # Mock notebook not found
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError) as exc_info:
            context_service.build_context_for_notebook(notebook_id, user_id)

        assert "not found or access denied" in str(exc_info.value).lower()
