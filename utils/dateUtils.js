const moment = require('moment');

/**
 * Date utility functions for analytics and reporting
 */
class DateUtils {
  /**
   * Get date range for different periods
   * @param {string} period - 'daily', 'weekly', 'monthly', 'yearly'
   * @param {Date} date - Base date (default: today)
   * @returns {Object} Start and end dates
   */
  static getDateRange(period, date = new Date()) {
    const baseDate = moment(date);
    
    switch (period) {
      case 'daily':
        return {
          start: baseDate.clone().startOf('day').toDate(),
          end: baseDate.clone().endOf('day').toDate()
        };
      
      case 'weekly':
        return {
          start: baseDate.clone().startOf('week').toDate(),
          end: baseDate.clone().endOf('week').toDate()
        };
      
      case 'monthly':
        return {
          start: baseDate.clone().startOf('month').toDate(),
          end: baseDate.clone().endOf('month').toDate()
        };
      
      case 'yearly':
        return {
          start: baseDate.clone().startOf('year').toDate(),
          end: baseDate.clone().endOf('year').toDate()
        };
      
      default:
        throw new Error('Invalid period. Use: daily, weekly, monthly, yearly');
    }
  }

  /**
   * Get date ranges for comparison (current vs previous period)
   * @param {string} period - 'daily', 'weekly', 'monthly', 'yearly'
   * @param {Date} date - Base date (default: today)
   * @returns {Object} Current and previous period date ranges
   */
  static getComparisonDateRanges(period, date = new Date()) {
    const current = this.getDateRange(period, date);
    const baseDate = moment(date);
    
    let previousDate;
    switch (period) {
      case 'daily':
        previousDate = baseDate.clone().subtract(1, 'day').toDate();
        break;
      case 'weekly':
        previousDate = baseDate.clone().subtract(1, 'week').toDate();
        break;
      case 'monthly':
        previousDate = baseDate.clone().subtract(1, 'month').toDate();
        break;
      case 'yearly':
        previousDate = baseDate.clone().subtract(1, 'year').toDate();
        break;
    }
    
    const previous = this.getDateRange(period, previousDate);
    
    return {
      current,
      previous
    };
  }

  /**
   * Get date range from custom start and end dates
   * @param {string|Date} startDate 
   * @param {string|Date} endDate 
   * @returns {Object} Formatted date range
   */
  static getCustomDateRange(startDate, endDate) {
    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();
    
    if (start > end) {
      throw new Error('Start date cannot be greater than end date');
    }
    
    return { start, end };
  }

  /**
   * Generate date intervals for time series data
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @param {string} interval - 'hour', 'day', 'week', 'month'
   * @returns {Array} Array of date intervals
   */
  static generateDateIntervals(startDate, endDate, interval = 'day') {
    const intervals = [];
    const current = moment(startDate);
    const end = moment(endDate);
    
    while (current <= end) {
      intervals.push({
        start: current.clone().startOf(interval).toDate(),
        end: current.clone().endOf(interval).toDate(),
        label: current.format(this.getFormatForInterval(interval))
      });
      current.add(1, interval);
    }
    
    return intervals;
  }

  /**
   * Get format string for different intervals
   * @private
   */
  static getFormatForInterval(interval) {
    switch (interval) {
      case 'hour':
        return 'YYYY-MM-DD HH:00';
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'YYYY-[W]WW';
      case 'month':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }
}

module.exports = DateUtils;
